import { object, string } from 'yup';

const trimmedString = () =>
  string().transform((_value, original) =>
    typeof original === 'string' ? original.trim() : original,
  );
const emailMessage = 'Enter a valid email address.';
const nameMessage = 'Enter your full name.';

export const founderSignupSchema = object({
  email: trimmedString().typeError(emailMessage).email(emailMessage).required(emailMessage),
  name: trimmedString().typeError(nameMessage),
}).required();

export const weeklyDealsSchema = founderSignupSchema.shape({
  name: trimmedString().typeError(nameMessage).required(nameMessage),
});
