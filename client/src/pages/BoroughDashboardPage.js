import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getBoroughStats, getCommonViolations } from '../api/endpoints';
import { EmptyState, ErrorState, LoadingBlock, Panel, PanelBody } from '../components/States';
import { PageHeader, PageKicker, PageTitle, TitleRow, Grid, TwoCol } from '../components/Page';
import { fmtNum, safeText } from '../utils/format';

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: ${({ theme }) => theme.space.md};

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const StatCard = styled(Panel)`
  padding: ${({ theme }) => theme.space.lg};
  display: grid;
  gap: 8px;
`;

const StatTitle = styled.div`
  font-family: ${({ theme }) => theme.font.display};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.text2};
  font-size: 12px;
`;

const StatValue = styled.div`
  font-family: ${({ theme }) => theme.font.display};
  font-size: 26px;
  letter-spacing: 0.04em;
`;

const Mini = styled.div`
  color: ${({ theme }) => theme.color.text2};
  font-size: 12px;
  line-height: 1.5;
`;

function pickBoroughRows(data) {
  const arr = Array.isArray(data) ? data : data?.rows ?? data?.boroughs ?? [];
  return arr.map((x) => ({
    borough: x.borough ?? x.boro ?? x.BORO ?? x.name,
    restaurants: x.restaurant_count ?? x.restaurants ?? x.count ?? x.n_restaurants,
    avg_score: x.avg_inspection_score ?? x.avg_score ?? x.mean_score,
    a_rate: x.a_grade_rate ?? x.a_rate ?? x.pct_a ?? x.percent_a,
  }));
}

function pickViolationRows(data) {
  const arr = Array.isArray(data) ? data : data?.rows ?? data?.violations ?? [];
  return arr;
}

export function BoroughDashboardPage() {
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [boroStats, setBoroStats] = useState([]);
  const [violations, setViolations] = useState([]);

  useEffect(() => {
    let alive = true;
    async function load() {
      setStatus('loading');
      setError(null);
      try {
        const [s, v] = await Promise.all([getBoroughStats(), getCommonViolations()]);
        if (!alive) return;
        setBoroStats(pickBoroughRows(s));
        setViolations(pickViolationRows(v));
        setStatus('ok');
      } catch (e) {
        if (!alive) return;
        setStatus('error');
        setError(e);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  const chartData = useMemo(() => {
    const copy = [...boroStats].filter((x) => x.borough);
    copy.sort((a, b) => Number(a.avg_score ?? 0) - Number(b.avg_score ?? 0));
    return copy.map((x) => ({
      borough: x.borough,
      avgScore: Number(x.avg_score ?? 0),
    }));
  }, [boroStats]);

  const top5ByBoro = useMemo(() => {
    // Expect payload like [{ borough, violation_code, description, count }, ...]
    const grouped = new Map();
    violations.forEach((v) => {
      const b = v.borough ?? v.boro ?? v.BORO ?? 'Unknown';
      const arr = grouped.get(b) ?? [];
      arr.push({
        code: v.violation_code ?? v.code ?? v.VIOLATIONCODE,
        description: v.violation_description ?? v.description ?? v.VIOLATIONDESCRIPTION,
        count: v.count ?? v.times ?? v.n,
      });
      grouped.set(b, arr);
    });
    const out = [];
    grouped.forEach((arr, b) => {
      arr.sort((a, c) => Number(c.count ?? 0) - Number(a.count ?? 0));
      out.push({ borough: b, top: arr.slice(0, 5) });
    });
    out.sort((a, b) => a.borough.localeCompare(b.borough));
    return out;
  }, [violations]);

  if (status === 'loading') {
    return (
      <Grid>
        <LoadingBlock $h={110} />
        <LoadingBlock $h={120} />
        <TwoCol>
          <LoadingBlock $h={360} />
          <LoadingBlock $h={360} />
        </TwoCol>
      </Grid>
    );
  }

  if (status === 'error') return <ErrorState detail={error?.message} />;

  if (!boroStats.length) return <EmptyState title="No borough analytics" detail="The borough stats endpoint returned an empty payload." />;

  return (
    <Grid>
      <PageHeader>
        <TitleRow>
          <PageTitle>Borough Analytics</PageTitle>
        </TitleRow>
        <PageKicker>
          Borough-level aggregates across all inspections: restaurant counts, average inspection score, and A-grade rate. Charts are designed
          for quick comparisons.
        </PageKicker>
      </PageHeader>

      <StatGrid>
        {boroStats.map((b) => (
          <StatCard key={b.borough}>
            <StatTitle>{safeText(b.borough)}</StatTitle>
            <StatValue>{b.restaurants != null ? fmtNum(b.restaurants) : '—'}</StatValue>
            <Mini>
              Avg score: {b.avg_score != null ? fmtNum(b.avg_score, 1) : '—'} · A-rate:{' '}
              {b.a_rate != null ? `${fmtNum(Number(b.a_rate) * (Number(b.a_rate) <= 1 ? 100 : 1), 1)}%` : '—'}
            </Mini>
          </StatCard>
        ))}
      </StatGrid>

      <TwoCol>
        <Panel>
          <PanelBody>
            <h3 style={{ marginBottom: 10 }}>Avg inspection score by borough</h3>
            <Mini style={{ marginBottom: 10 }}>Lower is better. Scores ≥ 28 are considered poor.</Mini>
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 10, right: 18, left: 0, bottom: 20 }}>
                  <CartesianGrid stroke="rgba(231,237,246,0.10)" vertical={false} />
                  <XAxis dataKey="borough" tick={{ fill: 'rgba(231,237,246,0.72)', fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: 'rgba(231,237,246,0.72)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: '#0f1621', border: '1px solid rgba(231,237,246,0.18)', borderRadius: 10 }}
                    labelStyle={{ color: 'rgba(231,237,246,0.8)' }}
                  />
                  <Bar dataKey="avgScore" fill="rgba(255,176,32,0.82)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelBody>
            <h3 style={{ marginBottom: 10 }}>Most common violations (top 5)</h3>
            <Mini style={{ marginBottom: 10 }}>Grouped per borough from `GET /api/violations/common`.</Mini>
            {top5ByBoro.length ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {top5ByBoro.map((g) => (
                  <div key={g.borough} style={{ border: '1px solid rgba(231,237,246,0.12)', borderRadius: 12, padding: 12, background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {safeText(g.borough)}
                    </div>
                    <div style={{ marginTop: 6, display: 'grid', gap: 6 }}>
                      {g.top.map((v, idx) => (
                        <div key={`${v.code ?? idx}`} style={{ fontSize: 12, color: 'rgba(231,237,246,0.8)' }}>
                          <span style={{ color: '#e7edf6' }}>{safeText(v.code)}</span> — {safeText(v.description)}{' '}
                          <span style={{ color: 'rgba(255,176,32,0.9)' }}>({fmtNum(v.count)})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No common-violation data" detail="If your endpoint returns a different shape, we can map it quickly." />
            )}
          </PanelBody>
        </Panel>
      </TwoCol>
    </Grid>
  );
}

