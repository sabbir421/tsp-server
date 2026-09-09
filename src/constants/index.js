const USER_ROLES = {
  BUYER_TENANT: 'buyer_tenant',
  SELLER_AGENT: 'seller_agent',
  BACHELOR_POSTER: 'bachelor_poster',
};

const ROLE_LABELS = {
  [USER_ROLES.BUYER_TENANT]: 'Buyer / Tenant',
  [USER_ROLES.SELLER_AGENT]: 'Seller / Agent / Developer',
  [USER_ROLES.BACHELOR_POSTER]: 'Bachelor Poster',
};

const OTP_TYPES = {
  REGISTRATION: 'registration',
  LOGIN: 'login',
  PASSWORD_RESET: 'password_reset',
};

module.exports = {
  USER_ROLES,
  ROLE_LABELS,
  OTP_TYPES,
};
