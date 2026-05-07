import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { getMismatch } from '../api/endpoints';
import { EmptyState, ErrorState, LoadingBlock } from '../components/States';
import { PageHeader, PageKicker, PageTitle, TitleRow, Grid } from '../components/Page';
import { Controls, ControlRow, Field, Input, ButtonRow, Button } from '../components/Controls';
import { TableWrap, Table, Th, Td, Tr, SortButton, SortLabel } from '../components/DataTable';
import { GradeBadge } from '../components/GradeBadge';
import { fmtNum, safeText } from '../utils/format';
import { Link } from 'react-router-dom';

const Compact = styled.div`
  color: ${({ theme }) => theme.color.text2};
  font-size: 12px;
`;

function num(v) {
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}

export function DangerZonePage() {
  const [minRating, setMinRating] = useState('4.0');
  const [minScore, setMinScore] = useState('28');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);

  const [sortKey, setSortKey] = useState('latest_score');
  const [sortDir, setSortDir] = useState('desc');

  async function load() {
    setStatus('loading');
    setError(null);
    try {
      const data = await getMismatch({ min_rating: minRating, min_score: minScore });
      const arr = Array.isArray(data) ? data : data?.rows ?? [];
      setRows(arr);
      setStatus('ok');
    } catch (e) {
      setStatus('error');
      setError(e);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const aScore = num(a.latest_score ?? a.score);
      const bScore = num(b.latest_score ?? b.score);
      const aRating = num(a.google_rating ?? a.rating ?? a.avg_rating);
      const bRating = num(b.google_rating ?? b.rating ?? b.avg_rating);
      const va = sortKey === 'latest_score' ? aScore : aRating;
      const vb = sortKey === 'latest_score' ? bScore : bRating;
      if (va === null && vb === null) return 0;
      if (va === null) return 1;
      if (vb === null) return -1;
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return copy;
  }, [rows, sortDir, sortKey]);

  function toggleSort(nextKey) {
    if (sortKey === nextKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(nextKey);
      setSortDir('desc');
    }
  }

  return (
    <Grid>
      <PageHeader>
        <TitleRow>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <PageTitle>Danger Zone</PageTitle>
            <img src="/warning.png" alt="" style={{ width: 98, height: 98, objectFit: 'contain' }} />
          </div>
        </TitleRow>
        <PageKicker>
          Restaurants with a Google rating ≥ {minRating} but have a latest NYC inspection score ≥ {minScore}. These restaurants look great publicly, but they are failing basic food safety standards.
        </PageKicker>
      </PageHeader>

      <Controls>
        <ControlRow style={{ gridTemplateColumns: '1fr 1fr 2fr 2fr 2fr' }}>
          <Field>
            Min rating
            <Input value={minRating} onChange={(e) => setMinRating(e.target.value)} inputMode="decimal" />
          </Field>
          <Field>
            Min score
            <Input value={minScore} onChange={(e) => setMinScore(e.target.value)} inputMode="numeric" />
          </Field>
          <div />
          <div />
          <div />
        </ControlRow>
        <ButtonRow>
          <Button onClick={load} disabled={status === 'loading'}>
            {status === 'loading' ? 'Loading…' : 'Refresh'}
          </Button>
        </ButtonRow>
      </Controls>

      {status === 'error' ? <ErrorState detail={error?.message} /> : null}
      {status === 'loading' ? <LoadingBlock $h={360} /> : null}

      {status === 'ok' ? (
        sorted.length ? (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Borough</Th>
                  <Th>Cuisine</Th>
                  <Th>
                    <SortButton onClick={() => toggleSort('rating')}>
                      <SortLabel label="Google rating" active={sortKey === 'rating'} dir={sortDir} />
                    </SortButton>
                  </Th>
                  <Th>Reviews</Th>
                  <Th>
                    <SortButton onClick={() => toggleSort('latest_score')}>
                      <SortLabel label="Latest score" active={sortKey === 'latest_score'} dir={sortDir} />
                    </SortButton>
                  </Th>
                  <Th>Grade</Th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, i) => {
                  const camis = r.camis ?? r.CAMIS ?? r.id;
                  const name = r.name ?? r.dba ?? r.DBA;
                  const boro = r.borough ?? r.boro ?? r.BORO;
                  const cuisine = r.cuisine ?? r.cuisine_description ?? r.CUISINE_DESCRIPTION;
                  const rating = r.google_rating ?? r.rating ?? r.avg_rating;
                  const reviews = r.review_count ?? r.user_ratings_total ?? r.reviews;
                  const score = r.latest_score ?? r.score;
                  const grade = r.latest_grade ?? r.grade ?? r.GRADE;
                  return (
                    <Tr key={camis ?? i}>
                      <Td style={{ whiteSpace: 'normal', maxWidth: 420 }}>
                        {camis ? <Link to={`/restaurants/${encodeURIComponent(camis)}`}>{safeText(name)}</Link> : safeText(name)}
                      </Td>
                      <Td>{safeText(boro)}</Td>
                      <Td style={{ whiteSpace: 'normal', maxWidth: 340 }}>{safeText(cuisine)}</Td>
                      <Td>{rating ? fmtNum(rating, 1) : '—'}</Td>
                      <Td>{reviews ? fmtNum(reviews) : '—'}</Td>
                      <Td>{score != null ? fmtNum(score) : '—'}</Td>
                      <Td>
                        <GradeBadge grade={grade} />
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>
        ) : (
          <EmptyState title="No danger-zone matches" detail="Try lowering thresholds or widening your filters." />
        )
      ) : null}
    </Grid>
  );
}

