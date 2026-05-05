import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRepeatOffenders } from '../api/endpoints';
import { BOROUGHS } from '../utils/constants';
import { EmptyState, ErrorState, LoadingBlock } from '../components/States';
import { PageHeader, PageKicker, PageTitle, TitleRow, Grid } from '../components/Page';
import { Controls, ControlRow, Field, Select, Input, ButtonRow, Button } from '../components/Controls';
import { TableWrap, Table, Th, Td, Tr } from '../components/DataTable';
import { fmtNum, safeText } from '../utils/format';

export function RepeatOffendersPage() {
  const [boro, setBoro] = useState('');
  const [minTimes, setMinTimes] = useState('3');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);

  async function load() {
    setStatus('loading');
    setError(null);
    try {
      const data = await getRepeatOffenders({ min_times: minTimes, boro });
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

  const displayRows = useMemo(() => rows, [rows]);

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
        <ControlRow style={{ gridTemplateColumns: '1fr 1fr 2fr 2fr 2fr' }}>
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
            Min times
            <Input value={minTimes} onChange={(e) => setMinTimes(e.target.value)} inputMode="numeric" />
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
                {displayRows.map((r, i) => {
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
          </TableWrap>
        ) : (
          <EmptyState title="No repeat offenders found" detail="Try lowering the minimum count or removing borough filtering." />
        )
      ) : null}
    </Grid>
  );
}

