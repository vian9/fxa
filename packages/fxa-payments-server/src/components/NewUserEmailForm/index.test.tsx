import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import { NewUserEmailForm } from './index';

describe('NewUserEmailForm test with l10n', () => {
  it('renders as expected', () => {
    const { queryByTestId } = render(
      <NewUserEmailForm onBlurInitial={() => {}} onBlurConfirm={() => {}} />
    );
    const form = queryByTestId('newuseremailform');
    expect(form).toBeInTheDocument();
  });
});
