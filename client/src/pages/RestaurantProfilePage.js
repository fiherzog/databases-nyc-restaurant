import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { getRestaurantInspections, getRestaurantProfile } from '../api/endpoints';
import { GradeBadge } from '../components/GradeBadge';
import { EmptyState, ErrorState, LoadingBlock, Panel, PanelBody, Subtle } from '../components/States';
import { PageHeader, PageKicker, PageTitle, TitleRow, TwoCol, Grid } from '../components/Page';
import { fmtDate, fmtNum, safeText } from '../utils/format';
import { TableWrap, Table, Th, Td, Tr } from '../components/DataTable';

const MapsButton = styled.a`
  display: inline-block;
  margin-top: 8px;
  padding: 8px 14px;
  border-radius: 8px;
  background: #000;
  color: #FFE9B9;
  font-weight: 700;
  font-size: 13px;
  text-decoration: none;
  transition: transform 150ms ease, background 150ms ease, box-shadow 150ms ease;

  &:hover {
    transform: translateY(-2px);
    background: #222;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
  }
`;

const BackLink = styled(Link)`
  color: ${({ theme }) => theme.color.link};
  font-size: 12px;
  opacity: 0.95;
`;

const BigName = styled.div`
  font-family: ${({ theme }) => theme.font.display};
  font-weight: 700;
  font-size: 34px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const Meta = styled.div`
  color: ${({ theme }) => theme.color.text2};
  font-size: 12px;
  line-height: 1.6;
`;

const StatRow = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space.md};
`;

const Stat = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.md};
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: 1px solid ${({ theme }) => theme.color.border};
  background: rgba(255, 255, 255, 0.02);
  font-size: 12px;
  color: ${({ theme }) => theme.color.text2};
`;

const StatValue = styled.span`
  color: ${({ theme }) => theme.color.text};
`;

function pickProfile(data) {
  const base = data?.restaurant ?? data?.profile ?? data?.restaurant_profile ?? data;
  const latest = data?.latest_inspection ?? data?.latest ?? data?.inspection ?? base?.latest_inspection;
  const google = data?.google ?? data?.google_data ?? base?.google;
  return { base, latest, google };
}

export function RestaurantProfilePage() {
  const { camis } = useParams();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const [profileData, setProfileData] = useState(null);
  const [inspections, setInspections] = useState(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      setStatus('loading');
      setError(null);
      try {
        const [p, hist] = await Promise.all([getRestaurantProfile(camis), getRestaurantInspections(camis)]);
        if (!alive) return;
        setProfileData(p);
        setInspections(Array.isArray(hist) ? hist : hist?.rows ?? []);
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
  }, [camis]);

  if (status === 'loading') {
    return (
      <Grid>
        <LoadingBlock $h={120} />
        <TwoCol>
          <LoadingBlock $h={220} />
          <LoadingBlock $h={220} />
        </TwoCol>
        <LoadingBlock $h={360} />
      </Grid>
    );
  }

  if (status === 'error') return <ErrorState detail={error?.message} />;

  const { base, latest, google } = pickProfile(profileData);
  if (!base) return <EmptyState title="Restaurant not found" detail="This CAMIS didn’t return a profile payload." />;

  const name = base.name ?? base.dba ?? base.DBA;
  const address =
    base.address ??
    [base.building, base.street, base.zipcode].filter(Boolean).join(' ') ??
    base.formatted_address;
  const cuisine = base.cuisine ?? base.cuisine_description ?? base.CUISINE_DESCRIPTION;
  const boro = base.borough ?? base.boro ?? base.BORO;

  const latestDate = latest?.date ?? latest?.inspection_date ?? latest?.INSPECTION_DATE;
  const latestScore = latest?.score ?? latest?.inspection_score ?? latest?.SCORE;
  const latestGrade = latest?.grade ?? latest?.GRADE;

  const gRating = google?.avg_rating ?? google?.rating ?? base?.google_rating;
  const gReviews = google?.review_count ?? google?.user_ratings_total ?? base?.review_count;
  const gPrice = google?.price_level ?? base?.price_level;

  return (
    <Grid>
      <PageHeader>
        <BackLink to="/">← Back to search</BackLink>
        <TitleRow>
          <PageTitle>Restaurant</PageTitle>
        </TitleRow>
      </PageHeader>

      <Panel>
        <PanelBody>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
            <div>
              <BigName>{safeText(name)}</BigName>
              <Meta>
                {safeText(address)}
                <br />
                {safeText(boro)} · {safeText(cuisine)}
              </Meta>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <GradeBadge grade={latestGrade ?? base.latest_grade ?? base.grade} />
            </div>
          </div>
        </PanelBody>
      </Panel>

      <TwoCol>
        <Panel>
          <PanelBody>
            <h3 style={{ marginBottom: 10 }}>Latest inspection</h3>
            <StatRow>
              <Stat>
                <span>Date</span>
                <StatValue>{fmtDate(latestDate)}</StatValue>
              </Stat>
              <Stat>
                <span>Score</span>
                <StatValue>{fmtNum(latestScore)}</StatValue>
              </Stat>
              <Stat style={{ alignItems: 'center' }}>
                <span>Grade</span>
                <StatValue>
                  <GradeBadge grade={latestGrade} />
                </StatValue>
              </Stat>
            </StatRow>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelBody>
            <h3 style={{ marginBottom: 10 }}>Google Maps (if matched)</h3>
            {gRating || gReviews || gPrice ? (
              <StatRow>
                <Stat>
                  <span>Avg rating</span>
                  <StatValue>{gRating ? fmtNum(gRating, 1) : '—'}</StatValue>
                </Stat>
                <Stat>
                  <span>Reviews</span>
                  <StatValue>{gReviews ? fmtNum(gReviews) : '—'}</StatValue>
                </Stat>
                <Stat>
                  <span>Price level</span>
                  <StatValue>{gPrice ?? '—'}</StatValue>
                </Stat>
                <MapsButton
                  href={`https://www.google.com/maps/search/?api=1${google?.place_id ? `&query=${encodeURIComponent(name)}&query_place_id=${google.place_id}` : `&query=${encodeURIComponent(`${name} ${address ?? ''} ${boro ?? ''} NYC`)}`}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Discover on Maps
                </MapsButton>
              </StatRow>
            ) : (
              <EmptyState title="No Google data available" detail="This restaurant didn’t match to a Google place record." />
            )}
          </PanelBody>
        </Panel>
      </TwoCol>

      <div>
        <h2 style={{ marginBottom: 10 }}>Inspection history</h2>
        {inspections && inspections.length ? (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Score</Th>
                  <Th>Grade</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody>
                {inspections.map((x, i) => {
                  const d = x.date ?? x.inspection_date ?? x.INSPECTION_DATE;
                  const s = x.score ?? x.inspection_score ?? x.SCORE;
                  const g = x.grade ?? x.GRADE;
                  const a = x.action ?? x.action_description ?? x.ACTION;
                  return (
                    <Tr key={x.inspection_id ?? x.id ?? i}>
                      <Td>{fmtDate(d)}</Td>
                      <Td>{fmtNum(s)}</Td>
                      <Td>
                        <GradeBadge grade={g} />
                      </Td>
                      <Td style={{ whiteSpace: 'normal', maxWidth: 520 }}>{safeText(a)}</Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>
        ) : (
          <EmptyState title="No inspection history found" />
        )}
      </div>
    </Grid>
  );
}

