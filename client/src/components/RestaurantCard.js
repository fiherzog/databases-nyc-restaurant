import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { GradeBadge } from './GradeBadge';
import { fmtNum, safeText } from '../utils/format';

const Card = styled(Link)`
  display: grid;
  gap: 10px;
  padding: ${({ theme }) => theme.space.lg};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  background: #FFE9B9;
  box-shadow: 0 14px 28px ${({ theme }) => theme.color.shadow};
  transition: transform 130ms ease, border-color 130ms ease, background 130ms ease;

  &:hover {
    transform: translateY(-2px);
    border-color: ${({ theme }) => theme.color.border2};
    background: #f5d99a;
  }
`;

const Top = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.md};
`;

const Name = styled.div`
  font-family: ${({ theme }) => theme.font.display};
  font-weight: 700;
  font-size: 22px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  line-height: 1.1;
`;

const Meta = styled.div`
  color: ${({ theme }) => theme.color.text2};
  font-size: 12px;
  line-height: 1.5;
`;

const Row = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.md};
  flex-wrap: wrap;
  align-items: center;
`;

const Metric = styled.div`
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.color.border};
  background: rgba(0, 0, 0, 0.05);
  font-size: 12px;
  color: ${({ theme }) => theme.color.text2};
`;

export function RestaurantCard({ r }) {
  const camis = r.camis ?? r.CAMIS ?? r.id;
  const name = r.name ?? r.dba ?? r.DBA;
  const boro = r.borough ?? r.boro ?? r.BORO;
  const cuisine = r.cuisine ?? r.cuisine_description ?? r.CUISINE_DESCRIPTION;
  const grade = r.latest_grade ?? r.grade ?? r.GRADE;
  const rating = r.google_rating ?? r.rating ?? r.avg_rating;

  return (
    <Card to={`/restaurants/${encodeURIComponent(camis)}`}>
      <Top>
        <div>
          <Name>{safeText(name)}</Name>
          <Meta>
            {safeText(boro)} · {safeText(cuisine)}
          </Meta>
        </div>
        <GradeBadge grade={grade} />
      </Top>

      <Row>
        <Metric>
          Google: <span style={{ color: '#000000' }}>{rating ? fmtNum(rating, 1) : '—'}</span>
        </Metric>
        {r.latest_score ?? r.score ? (
          <Metric>
            Score: <span style={{ color: '#000000' }}>{fmtNum(r.latest_score ?? r.score)}</span>
          </Metric>
        ) : null}
      </Row>
    </Card>
  );
}

