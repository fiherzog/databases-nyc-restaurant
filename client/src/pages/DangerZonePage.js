import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { getMismatch } from '../api/endpoints';
import { Pagination, paginate } from '../components/Pagination';
import { BOROUGHS } from '../utils/constants';
import { EmptyState, ErrorState, LoadingBlock } from '../components/States';
import { PageHeader, PageKicker, PageTitle, TitleRow, Grid } from '../components/Page';
import { Controls, ControlRow, Field, Input, Select, ButtonRow, Button, GhostButton } from '../components/Controls';
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
  const [boro, setBoro] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [nameSearch, setNameSearch] = useState('');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);

  const [sortKey, setSortKey] = useState('latest_score');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  async function load() {
    setPage(0);
    setStatus('loading');
    setError(null);
    try {
      const data = await getMismatch({ min_rating: minRating, min_score: minScore, boro, cuisine });
      const arr = Array.isArray(data) ? data : data?.rows ?? [];
      setRows(arr);
      setStatus('ok');
    } catch (e) {
      setStatus('error');
      setError(e);
    }
  }

  function reset() {
    setMinRating('4.0');
    setMinScore('28');
    setBoro('');
    setCuisine('');
    setNameSearch('');
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = useMemo(() => {
    let filtered = rows;
    if (nameSearch.trim()) {
      const q = nameSearch.trim().toLowerCase();
      filtered = filtered.filter((r) => (r.name ?? r.dba ?? '').toLowerCase().includes(q));
    }
    const copy = [...filtered];
    copy.sort((a, b) => {
      if (sortKey === 'name') {
        const va = (a.name ?? a.dba ?? '').toLowerCase();
        const vb = (b.name ?? b.dba ?? '').toLowerCase();
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      if (sortKey === 'borough') {
        const va = (a.borough ?? a.boro ?? '').toLowerCase();
        const vb = (b.borough ?? b.boro ?? '').toLowerCase();
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      const aScore = num(a.latest_score ?? a.score);
      const bScore = num(b.latest_score ?? b.score);
      const aRating = num(a.google_rating ?? a.rating ?? a.avg_rating);
      const bRating = num(b.google_rating ?? b.rating ?? b.avg_rating);
      const aReviews = num(a.review_count ?? a.user_ratings_total ?? a.reviews);
      const bReviews = num(b.review_count ?? b.user_ratings_total ?? b.reviews);
      const va = sortKey === 'latest_score' ? aScore : sortKey === 'rating' ? aRating : aReviews;
      const vb = sortKey === 'latest_score' ? bScore : sortKey === 'rating' ? bRating : bReviews;
      if (va === null && vb === null) return 0;
      if (va === null) return 1;
      if (vb === null) return -1;
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return copy;
  }, [rows, sortDir, sortKey, nameSearch]);

  const pageRows = useMemo(() => paginate(sorted, page, PAGE_SIZE), [sorted, page]);

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
        <ControlRow>
          <Field>
            Min rating
            <Input value={minRating} onChange={(e) => setMinRating(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} inputMode="decimal" />
          </Field>
          <Field>
            Min score
            <Input value={minScore} onChange={(e) => setMinScore(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} inputMode="numeric" />
          </Field>
          <Field>
            Borough
            <Select value={boro} onChange={(e) => setBoro(e.target.value)}>
              <option value="">All</option>
              {BOROUGHS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </Select>
          </Field>
          <Field>
            Cuisine
            <Input value={cuisine} onChange={(e) => setCuisine(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="e.g., Pizza" />
          </Field>
          <Field>
            Restaurant name
            <Input value={nameSearch} onChange={(e) => setNameSearch(e.target.value)} placeholder="Filter by name…" />
          </Field>
        </ControlRow>
        <ButtonRow>
          <Button onClick={load} disabled={status === 'loading'}>
            {status === 'loading' ? 'Loading…' : 'Search'}
          </Button>
          <GhostButton onClick={reset} disabled={status === 'loading'}>
            Reset filters
          </GhostButton>
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
                  <Th>
                    <SortButton onClick={() => toggleSort('name')}>
                      <SortLabel label="Name" active={sortKey === 'name'} dir={sortDir} />
                    </SortButton>
                  </Th>
                  <Th>
                    <SortButton onClick={() => toggleSort('borough')}>
                      <SortLabel label="Borough" active={sortKey === 'borough'} dir={sortDir} />
                    </SortButton>
                  </Th>
                  <Th>Cuisine</Th>
                  <Th>
                    <SortButton onClick={() => toggleSort('rating')}>
                      <SortLabel label="Google rating" active={sortKey === 'rating'} dir={sortDir} />
                    </SortButton>
                  </Th>
                  <Th>
                    <SortButton onClick={() => toggleSort('review_count')}>
                      <SortLabel label="Reviews" active={sortKey === 'review_count'} dir={sortDir} />
                    </SortButton>
                  </Th>
                  <Th>
                    <SortButton onClick={() => toggleSort('latest_score')}>
                      <SortLabel label="Latest score" active={sortKey === 'latest_score'} dir={sortDir} />
                    </SortButton>
                  </Th>
                  <Th>Grade</Th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r, i) => {
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
          <Pagination page={page} setPage={setPage} total={sorted.length} pageSize={PAGE_SIZE} />
          </TableWrap>
        ) : (
          <EmptyState title="No danger-zone matches" detail="Try lowering thresholds or widening your filters." />
        )
      ) : null}
    </Grid>
  );
}

