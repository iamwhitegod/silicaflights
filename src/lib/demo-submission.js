export async function demoSubmit() {
  await new Promise((resolve) => setTimeout(resolve, 700));
}

export async function demoFailure() {
  await demoSubmit();
  throw new Error('The demo request failed. Please try again.');
}
