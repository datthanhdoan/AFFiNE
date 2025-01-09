import { cssVar } from '@toeverything/theme';
import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

export const paymentMethod = style({
  marginTop: '24px',
});

export const planCard = style({
  display: 'flex',
  justifyContent: 'space-between',
  padding: '12px',
  border: `1px solid ${cssVar('borderColor')}`,
  borderRadius: '8px',
});

export const currentPlan = style({
  flex: '1 0 0',
});

export const planPrice = style({
  fontSize: cssVar('fontH6'),
  fontWeight: 600,
});

export const activeButton = style({
  marginTop: '8px',
  marginRight: '8px',
});

export const seat = style({
  marginLeft: '4px',
});

export const activateModalContent = style({
  padding: '0',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  marginTop: '12px',
  marginBottom: '20px',
});

export const tips = style({
  color: cssVarV2('text/secondary'),
  fontSize: cssVar('fontSm'),
});
