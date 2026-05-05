import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { searchRestaurants } from '../api/endpoints';
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
  const [status, setStatus] = useState('idle'); // idle | loading | ok | error
  const [error, setError] = useState(null);

  const cuisineOptions = useMemo(() => uniqCuisine(rows), [rows]);

  async function runSearch() {
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
          <PageTitle>Search</PageTitle>
          <Hint>Tip: start broad, then pin down borough + grade.</Hint>
        </TitleRow>
        <PageKicker>
          Search NYC restaurants by name, borough, cuisine, Google rating, and latest inspection grade. Results are read-only and
          link to a full inspection history.
        </PageKicker>
      </PageHeader>

      <Controls>
        <ControlRow>
          <Field>
            Name / keyword
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., halal, pizza, cafe…" />
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
            <Input value={minRating} onChange={(e) => setMinRating(e.target.value)} placeholder="e.g., 4.0" inputMode="decimal" />
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
          <ResultsGrid>
            {rows.map((r, i) => (
              <RestaurantCard key={r.camis ?? r.CAMIS ?? r.id ?? i} r={r} />
            ))}
          </ResultsGrid>
        ) : (
          <EmptyState title="No matches" detail="Try removing filters or searching with a shorter keyword." />
        )
      ) : null}
    </Grid>
  );
}

