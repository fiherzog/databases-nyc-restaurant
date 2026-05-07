import { useEffect, useMemo, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { searchRestaurants } from '../api/endpoints';
import { Pagination, paginate } from '../components/Pagination';
import { BOROUGHS, GRADES } from '../utils/constants';
import { EmptyState, ErrorState, LoadingBlock } from '../components/States';
import { Controls, ControlRow, Field, Input, Select, ButtonRow, Button, GhostButton } from '../components/Controls';
import { PageHeader, PageKicker, PageTitle, TitleRow, Grid } from '../components/Page';
import { RestaurantCard } from '../components/RestaurantCard';

const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.space.lg};

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const swing = keyframes`
  0%   { transform: rotate(0deg); }
  50%  { transform: rotate(45deg); }
  100% { transform: rotate(0deg); }
`;

const MagnifyingIcon = styled.img`
  width: 58px;
  height: 58px;
  object-fit: contain;
  animation: ${swing} 3s steps(1, end) infinite;
  transform-origin: top left;
`;

const Hint = styled.div`
  color: ${({ theme }) => theme.color.text2};
  font-size: 12px;
  line-height: 1.5;
`;

function uniqCuisine(rows) {
  const set = new Set();
  rows.forEach((r) => {
    const v = r.cuisine ?? r.cuisine_description ?? r.CUISINE_DESCRIPTION;
    if (v) set.add(String(v).trim());
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b)).slice(0, 250);
}

export function HomeSearchPage() {
  const [name, setName] = useState('');
  const [boro, setBoro] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [grade, setGrade] = useState('');
  const [minRating, setMinRating] = useState('');

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const [status, setStatus] = useState('idle'); // idle | loading | ok | error
  const [error, setError] = useState(null);

  const cuisineOptions = useMemo(() => uniqCuisine(rows), [rows]);

  async function runSearch() {
    setPage(0);
    setStatus('loading');
    setError(null);
    try {
      const data = await searchRestaurants({
        name,
        boro,
        cuisine,
        grade,
        min_rating: minRating,
      });
      setRows(Array.isArray(data) ? data : data?.rows ?? []);
      setStatus('ok');
    } catch (e) {
      setStatus('error');
      setError(e);
    }
  }

  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function reset() {
    setName('');
    setBoro('');
    setCuisine('');
    setGrade('');
    setMinRating('');
  }

  return (
    <Grid>
      <PageHeader>
        <TitleRow>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
            <PageTitle style={{ position: 'relative', zIndex: 1 }}>Search</PageTitle>
            <MagnifyingIcon src="/magnifying.png" alt="" style={{ zIndex: 0, position: 'relative', top: -8, left: 6 }} />
          </div>
        </TitleRow>
        <PageKicker>
          Search NYC restaurants by name, borough, cuisine, Google rating, and latest inspection grade. Results are read-only and
          link to a full inspection history.
        </PageKicker>
        <Hint style={{ fontStyle: 'italic', marginTop: 6 }}>Score Definitions:</Hint>
        <Hint>* 0–13 = Grade A (good)</Hint>
        <Hint>* 14–27 = Grade B (some violations)</Hint>
        <Hint>* 28+ = Grade C (serious violations)</Hint>
      </PageHeader>

      <Controls>
        <ControlRow>
          <Field>
            Name / keyword
            <Input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && runSearch()} placeholder="e.g., halal, pizza, cafe…" />
          </Field>
          <Field>
            Borough
            <Select value={boro} onChange={(e) => setBoro(e.target.value)}>
              <option value="">All</option>
              {BOROUGHS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            Cuisine
            <Select value={cuisine} onChange={(e) => setCuisine(e.target.value)}>
              <option value="">All</option>
              {cuisineOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            Latest grade
            <Select value={grade} onChange={(e) => setGrade(e.target.value)}>
              <option value="">All</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            Min Google rating
            <Input value={minRating} onChange={(e) => setMinRating(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && runSearch()} placeholder="e.g., 4.0" inputMode="decimal" />
          </Field>
        </ControlRow>

        <ButtonRow>
          <Button onClick={runSearch} disabled={status === 'loading'}>
            {status === 'loading' ? 'Searching…' : 'Search'}
          </Button>
          <GhostButton onClick={reset} disabled={status === 'loading'}>
            Reset filters
          </GhostButton>
        </ButtonRow>
      </Controls>

      {status === 'error' ? <ErrorState detail={error?.message} /> : null}

      {status === 'loading' ? (
        <ResultsGrid>
          <LoadingBlock $h={150} />
          <LoadingBlock $h={150} />
          <LoadingBlock $h={150} />
          <LoadingBlock $h={150} />
        </ResultsGrid>
      ) : null}

      {status === 'ok' ? (
        rows.length ? (
          <>
            <ResultsGrid>
              {paginate(rows, page, PAGE_SIZE).map((r, i) => (
                <RestaurantCard key={r.camis ?? r.CAMIS ?? r.id ?? i} r={r} />
              ))}
            </ResultsGrid>
            <Pagination page={page} setPage={setPage} total={rows.length} pageSize={PAGE_SIZE} />
          </>
        ) : (
          <EmptyState title="No matches" detail="Try removing filters or searching with a shorter keyword." />
        )
      ) : null}
    </Grid>
  );
}

