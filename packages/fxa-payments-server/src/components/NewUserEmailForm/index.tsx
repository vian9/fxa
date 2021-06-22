import React from 'react';
import { Localized } from '@fluent/react';

import shieldIcon from '../../images/shield.svg';

import { Form, Input, Checkbox, OnValidateFunction } from '../fields';
import {
  State as ValidatorState,
  useValidatorState,
  MiddlewareReducer as ValidatorMiddlewareReducer,
} from '../../lib/validator';

import './index.scss';

export type NewUserEmailFormProps = {
  onBlurInitial: (event: React.FocusEvent<HTMLInputElement>) => void;
  onBlurConfirm: (event: React.FocusEvent<HTMLInputElement>) => void;
  getString?: Function;
  validatorInitialState?: ValidatorState;
  validatorMiddlewareReducer?: ValidatorMiddlewareReducer;
};

export const NewUserEmailForm = ({
  onBlurInitial,
  onBlurConfirm,
  getString,
  validatorInitialState,
  validatorMiddlewareReducer,
}: NewUserEmailFormProps) => {
  const validator = useValidatorState({
    initialState: validatorInitialState,
    middleware: validatorMiddlewareReducer,
  });

  return (
    <Form
      data-testid="newuseremailform"
      validator={validator}
      className="new-user-email-form"
    >
      {/*
        - sign in link needs to have link and metrics
        - hook up product updates checkbox to basket(this will probably happen on the back end)
        - if we detect that the email is already associated with an account(tested onBlur), we will show a tooltip "Sign in with your Firefox Account"
        */}
      <Localized id="new-user-sign-in-link">
        <p className="sign-in-copy">
          Already have a Firefox account? <a>Sign in</a>
        </p>
      </Localized>
      <Localized id="new-user-email" attrs={{ placeholder: true, label: true }}>
        <Input
          type="text"
          name="new-user-email"
          label="Enter your email"
          data-testid="new-user-email"
          placeholder="foxy@mozilla.com"
          onBlur={onBlurInitial}
          required
          spellCheck={false}
          onValidate={(value, focused, props) =>
            validateEmail(value, focused, props, getString)
          }
        />
      </Localized>

      <Localized id="new-user-confirm-email" attrs={{ label: true }}>
        <Input
          type="text"
          name="new-user-confirm-email"
          label="Confirm your email"
          data-testid="new-user-confirm-email"
          onBlur={onBlurConfirm}
          required
          spellCheck={false}
          onValidate={(value, focused, props) =>
            validateEmail(value, focused, props, getString)
          }
        />
      </Localized>

      <Localized id="new-user-subscribe-product-updates">
        <Checkbox
          data-testid="new-user-subscribe-product-updates"
          name="new-user-subscribe-product-updates"
        >
          I'd like to receive product updates from Firefox
        </Checkbox>
      </Localized>

      <div className="assurance-copy">
        <img src={shieldIcon} alt="shield" />
        <Localized id="new-user-subscribe-product-updates">
          <p>
            We only use your email to create your account. We will never sell it
            to a third party.
          </p>
        </Localized>
      </div>
    </Form>
  );
};

const validateEmail: OnValidateFunction = (
  value,
  focused,
  _props,
  getString
) => {
  // TODO: port error validation from content server https://mozilla-hub.atlassian.net/browse/FXA-3665
  let valid = true;
  if (value !== null && !value) {
    valid = false;
  }
  const errorMsg = getString
    ? /* istanbul ignore next - not testing l10n here */
      getString('new-user-email-validate')
    : 'Sign in with your Firefox Account';
  return {
    value,
    valid,
    error: !valid && !focused ? errorMsg : null,
  };
};

export default NewUserEmailForm;
