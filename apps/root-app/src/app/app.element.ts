import './app.element.scss';

export class AppElement extends HTMLElement {
  public static observedAttributes = [];

  connectedCallback() {
    const title = 'root-app';
    this.innerHTML = `
      <header class="flex">
    <img alt="Nx logo" width="75" src="https://nx.dev/assets/images/nx-logo-white.svg" />
    <h1>Welcome to ${title}!</h1>
</header>
<main>
    <h2>Micro Apps</h2>
    <div class="flex github-star-container">
      
    </div>
    
    <details open>
        <summary>Add UI library</summary>
        <pre>
\`# Generate UI lib
nx g @nrwl/angular:lib ui

# Add a component
nx g @nrwl/angular:component xyz --project ui\`</pre
        >
    </details>
    <details>
        <summary>View dependency graph</summary>
        <pre>\`nx dep-graph\`</pre>
    </details>
    <details>
        <summary>Run affected commands</summary>
        <pre>
\`# see what's been affected by changes
nx affected:dep-graph

# run tests for current changes
nx affected:test

# run e2e tests for current changes
nx affected:e2e
\`</pre
        >
    </details>
</main>
    `;
  }
}
customElements.define('nx-single-spa-demo-root', AppElement);
