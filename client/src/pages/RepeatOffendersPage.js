import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRepeatOffenders } from '../api/endpoints';
import { Pagination, paginate } from '../components/Pagination';
import { BOROUGHS } from '../utils/constants';
import { EmptyState, ErrorState, LoadingBlock } from '../components/States';
import { PageHeader, PageKicker, PageTitle, TitleRow, Grid } from '../components/Page';
import { Controls, ControlRow, Field, Select, Input, ButtonRow, Button } from '../components/Controls';
import { TableWrap, Table, Th, Td, Tr } from '../components/DataTable';
import { fmtNum, safeText } from '../utils/format';

export function RepeatOffendersPage() {
  const [boro, setBoro] = useState('');
  const [minTimes, setMinTimes] = useState('3');
  const [cuisine, setCuisine] = useState('');
  const [violationCode, setViolationCode] = useState('');
  const [nameSearch, setNameSearch] = useState('');
  const [sortBy, setSortBy] = useState('times_desc');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);

  async function load() {
    setPage(0);
    setStatus('loading');
    setError(null);
    try {
      const data = await getRepeatOffenders({ min_times: minTimes, boro, cuisine, violation_code: violationCode });
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

  const displayRows = useMemo(() => {
    let filtered = rows;
    if (nameSearch.trim()) {
      const q = nameSearch.trim().toLowerCase();
      filtered = filtered.filter((r) => (r.name ?? r.dba ?? '').toLowerCase().includes(q));
    }
    const sorted = [...filtered];
    if (sortBy === 'times_desc') sorted.sort((a, b) => (b.times_cited ?? b.count ?? 0) - (a.times_cited ?? a.count ?? 0));
    else if (sortBy === 'times_asc') sorted.sort((a, b) => (a.times_cited ?? a.count ?? 0) - (b.times_cited ?? b.count ?? 0));
    else if (sortBy === 'name') sorted.sort((a, b) => (a.name ?? a.dba ?? '').localeCompare(b.name ?? b.dba ?? ''));
    else if (sortBy === 'borough') sorted.sort((a, b) => (a.borough ?? a.boro ?? '').localeCompare(b.borough ?? b.boro ?? ''));
    return sorted;
  }, [rows, nameSearch, sortBy]);

  const pageRows = useMemo(() => paginate(displayRows, page, PAGE_SIZE), [displayRows, page]);

  return (
    <Grid>
      <PageHeader>
        <TitleRow>
          <PageTitle>Repeat Offenders</PageTitle>
        </TitleRow>
        <PageKicker>
          Restaurants cited {minTimes}+ times for the same critical violation. Filter by borough to find chronic patterns.
        </PageKicker>
      </PageHeader>

      <Controls>
        <ControlRow>
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
            Min times cited
            <Input value={minTimes} onChange={(e) => setMinTimes(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} inputMode="numeric" />
          </Field>
          <Field>
            Cuisine
            <Input value={cuisine} onChange={(e) => setCuisine(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="e.g., Pizza" />
          </Field>
          <Field>
            Violation code
            <Input value={violationCode} onChange={(e) => setViolationCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="e.g., 10F" />
          </Field>
          <Field>
            Sort by
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="times_desc">Times cited (high → low)</option>
              <option value="times_asc">Times cited (low → high)</option>
              <option value="name">Name (A → Z)</option>
              <option value="borough">Borough (A → Z)</option>
            </Select>
          </Field>
        </ControlRow>
        <ControlRow style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}>
          <Field>
            Restaurant name
            <Input value={nameSearch} onChange={(e) => setNameSearch(e.target.value)} placeholder="Filter by name…" />
          </Field>
          <div />
          <div />
          <div />
          <div />
        </ControlRow>
        <ButtonRow>
          <Button onClick={load} disabled={status === 'loading'}>
            {status === 'loading' ? 'Loading…' : 'Search'}
          </Button>
        </ButtonRow>
      </Controls>

      {status === 'error' ? <ErrorState detail={error?.message} /> : null}
      {status === 'loading' ? <LoadingBlock $h={360} /> : null}

      {status === 'ok' ? (
        displayRows.length ? (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Borough</Th>
                  <Th>Cuisine</Th>
                  <Th>Violation code</Th>
                  <Th>Violation description</Th>
                  <Th>Times cited</Th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r, i) => {
                  const camis = r.camis ?? r.CAMIS ?? r.id;
                  const name = r.name ?? r.dba ?? r.DBA;
                  const boro = r.borough ?? r.boro ?? r.BORO;
                  const cuisine = r.cuisine ?? r.cuisine_description ?? r.CUISINE_DESCRIPTION;
                  const code = r.violation_code ?? r.code ?? r.VIOLATIONCODE;
                  const desc = r.violation_description ?? r.description ?? r.VIOLATIONDESCRIPTION;
                  const times = r.times_cited ?? r.count ?? r.times ?? r.TIMES_CITED;
                  return (
                    <Tr key={`${camis ?? i}-${code ?? 'v'}`}>
                      <Td style={{ whiteSpace: 'normal', maxWidth: 360 }}>
                        {camis ? <Link to={`/restaurants/${encodeURIComponent(camis)}`}>{safeText(name)}</Link> : safeText(name)}
                      </Td>
                      <Td>{safeText(boro)}</Td>
                      <Td style={{ whiteSpace: 'normal', maxWidth: 240 }}>{safeText(cuisine)}</Td>
                      <Td>{safeText(code)}</Td>
                      <Td style={{ whiteSpace: 'normal', maxWidth: 560 }}>{safeText(desc)}</Td>
                      <Td>{times != null ? fmtNum(times) : '—'}</Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          <Pagination page={page} setPage={setPage} total={displayRows.length} pageSize={PAGE_SIZE} />
          </TableWrap>
        ) : (
          <EmptyState title="No repeat offenders found" detail="Try lowering the minimum count or removing borough filtering." />
        )
      ) : null}
    </Grid>
  );
}

