import concurrently from 'concurrently';

concurrently([
  {
    command: 'bun run dev',
    name: 'server',
    cwd: './packages/server',
    prefixColor: 'cyan',
  },
  {
    command: 'bun run dev',
    name: 'client',
    cwd: './packages/client',
    prefixColor: 'green',
  },
]);
