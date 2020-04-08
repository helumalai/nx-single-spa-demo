import React from 'react';

import './app.scss';

import { ReactComponent as Logo } from './logo.svg';
import star from './star.svg';

export const App = () => {
  /*
   * Replace the elements below with your own.
   *
   * Note: The corresponding styles are in the ./app.scss file.
   */
  return (
    <div className="app">
      <header className="flex">
        <Logo width="75" height="75" />
        <h1>Welcome to react-micro-app!</h1>
      </header>
      <main>
        <ul>
          <li>List Item 1</li>
          <li>List Item 2</li>
        </ul>
      </main>
    </div>
  );
};

export default App;
