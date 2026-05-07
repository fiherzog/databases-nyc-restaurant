import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDeclining } from '../api/endpoints';
import { Pagination, paginate } from '../components/Pagination';
import { EmptyState, ErrorState, LoadingBlock } from '../components/States';
import { PageHeader, PageKicker, PageTitle, TitleRow, Grid } from '../components/Page';
import { Controls, ControlRow, Field, Input, ButtonRow, Button } from '../components/Controls';
import { TableWrap, Table, Th, Td, Tr } from '../components/DataTable';
import { fmtDate, fmtNum, safeText } from '../utils/format';

export function DecliningRestaurantsPage() {
  const [minInspections, setMinInspections] = useState('3');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);

  async function load() {
    setStatus('loading');
    setError(null);
    try {
      const data = await getDeclining({ min_inspections: minInspections });
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
      const ai = Number(a.score_increase ?? a.increase ?? a.delta);
      const bi = Number(b.score_increase ?? b.increase ?? b.delta);
      if (!Number.isFinite(ai) && !Number.isFinite(bi)) return 0;
      if (!Number.isFinite(ai)) return 1;
      if (!Number.isFinite(bi)) return -1;
      return bi - ai;
    });
    return copy;
  }, [rows]);

  const pageRows = useMemo(() => paginate(sorted, page, PAGE_SIZE), [sorted, page]);

  return (
    <Grid>
      <PageHeader>
        <TitleRow>
          <PageTitle>Declining Restaurants</PageTitle>
        </TitleRow>
        <PageKicker>
          Restaurants whose latest inspection score is worse than their historical average (only those with {minInspections}+ inspections).
          Sorted by biggest deterioration in health inspection scores.
        </PageKicker>
      </PageHeader>

      <Controls>
        <ControlRow style={{ gridTemplateColumns: '1fr 2fr 2fr 2fr 2fr' }}>
          <Field>
            Min inspections
            <Input value={minInspections} onChange={(e) => setMinInspections(e.target.value)} inputMode="numeric" />
          </Field>
          <div />
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
                  <Th>Latest date</Th>
                  <Th>Latest score</Th>
                  <Th>Avg score</Th>
                  <Th>Score increase</Th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r, i) => {
                  const camis = r.camis ?? r.CAMIS ?? r.id;
                  const name = r.name ?? r.dba ?? r.DBA;
                  const boro = r.borough ?? r.boro ?? r.BORO;
                  const cuisine = r.cuisine ?? r.cuisine_description ?? r.CUISINE_DESCRIPTION;
                  const latestDate = r.latest_inspection_date ?? r.latest_date ?? r.date ?? r.inspection_date;
                  const latestScore = r.latest_score ?? r.score;
                  const avgScore = r.avg_score ?? r.average_score ?? r.mean_score;
                  const inc = r.score_increase ?? (latestScore != null && avgScore != null ? Number(latestScore) - Number(avgScore) : null);
                  return (
                    <Tr key={camis ?? i}>
                      <Td style={{ whiteSpace: 'normal', maxWidth: 360 }}>
                        {camis ? <Link to={`/restaurants/${encodeURIComponent(camis)}`}>{safeText(name)}</Link> : safeText(name)}
                      </Td>
                      <Td>{safeText(boro)}</Td>
                      <Td style={{ whiteSpace: 'normal', maxWidth: 260 }}>{safeText(cuisine)}</Td>
                      <Td>{fmtDate(latestDate)}</Td>
                      <Td>{latestScore != null ? fmtNum(latestScore) : '—'}</Td>
                      <Td>{avgScore != null ? fmtNum(avgScore, 1) : '—'}</Td>
                      <Td style={{ color: 'red' }}>{inc != null ? fmtNum(inc, 1) : '—'}</Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          <Pagination page={page} setPage={setPage} total={sorted.length} pageSize={PAGE_SIZE} />
          </TableWrap>
        ) : (
          <EmptyState title="No declining restaurants found" detail="Try lowering the minimum inspections threshold." />
        )
      ) : null}
    </Grid>
  );
}
