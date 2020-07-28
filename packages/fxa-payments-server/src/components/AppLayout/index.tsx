import React, { ReactNode, useEffect, useContext, useState } from 'react';
import { AppContext } from '../../lib/AppContext';
import { Localized } from '@fluent/react';
import classNames from 'classnames';

import './index.scss';

export type AppLayoutProps = {
  children: ReactNode;
};

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <>
      <div
        id="stage"
        data-testid="stage"
        className="fade-in-forward"
        style={{ opacity: 1 }}
      >
        {children}
      </div>
    </>
  );
};

export type SignInLayout = {
  children: ReactNode;
};

export const SignInLayoutContext = React.createContext({
  setHideLogo: (hideLogo: boolean) => {},
});

export const SignInLayout = ({ children }: SignInLayout) => {
  const [hideLogo, setHideLogo] = useState(false);
  const mainContentClassNames = classNames('card', 'payments-card', {
    'hide-logo': hideLogo,
  });
  return (
    <AppLayout>
      <SignInLayoutContext.Provider value={{ setHideLogo }}>
        <div className="sign-in">
          <div className={mainContentClassNames}>{children}</div>
        </div>
      </SignInLayoutContext.Provider>
    </AppLayout>
  );
};

export type SettingsLayout = {
  children: ReactNode;
};

export const SettingsLayout = ({ children }: SettingsLayout) => {
  useEffect(() => {
    document.body.classList.add('settings');
    return () => document.body.classList.remove('settings');
  }, [children]);

  const { config } = useContext(AppContext);
  const homeURL = `${config.servers.content.url}/settings`;
  let breadcrumbs = (
    <ol className="breadcrumbs" data-testid="breadcrumbs">
      <li>
        <Localized id="settings-home">
          <a href={homeURL}>Account Home</a>
        </Localized>
      </li>
      <li>
        <Localized id="settings-subscriptions-title">
          <a href="/subscriptions">Subscriptions</a>
        </Localized>
      </li>
    </ol>
  );

  return (
    <AppLayout>
      <div className="settings">
        <div id="fxa-settings-header-wrapper">
          <header id="fxa-settings-header">
            <h1 id="fxa-manage-account">
              <Localized id="project-brand">
                <span className="fxa-account-title">Firefox Accounts</span>
              </Localized>
            </h1>
            {/*
              * TODO: We can't actually sign out of FxA from here. Maybe back to settings?
              <button id="signout" className="settings-button secondary-button">Sign out</button>
              */}
          </header>
          {breadcrumbs}
        </div>

        <div id="fxa-settings">
          <div id="fxa-settings-content" className="card">
            {children}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AppLayout;
