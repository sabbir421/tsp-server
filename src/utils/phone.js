const DEFAULT_COUNTRY_DIGITS = '880';

const digitsOnly = (value) => String(value || '').replace(/\D/g, '');

const toSmsRecipient = (phone, countryCode = '+880') => {
  const countryDigits = digitsOnly(countryCode) || DEFAULT_COUNTRY_DIGITS;
  let phoneDigits = digitsOnly(phone);

  if (!phoneDigits) {
    throw { status: 400, message: 'A valid phone number is required' };
  }

  if (phoneDigits.startsWith(countryDigits)) {
    return phoneDigits;
  }

  if (phoneDigits.startsWith('0')) {
    return `${countryDigits}${phoneDigits.slice(1)}`;
  }

  return `${countryDigits}${phoneDigits}`;
};

module.exports = { toSmsRecipient };
