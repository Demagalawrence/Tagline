import { type PropsWithChildren } from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

const SPLASH_BG = '#0B0C10';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en" data-cq-splash="1">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: `
          html, body, #root {
            margin: 0;
            padding: 0;
            background-color: ${SPLASH_BG};
          }
        ` }} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
