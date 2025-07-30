import * as React from 'react';

export function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <div className="flex items-center gap-2" aria-label="AkselAI">
      <svg
        width="26"
        height="24"
        viewBox="0 0 26 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path
          d="M11.787 1.42789L0.528809 22.5H4.9585L7.33316 17.5137H17.721L20.0957 22.5H24.5254L13.2672 1.42789H11.787ZM8.44919 15.016L12.5271 6.51342L16.6051 15.016H8.44919Z"
          className="fill-green-500"
        />
      </svg>
      <span className="font-headline text-2xl font-bold tracking-tighter text-foreground">
        AkselAI
      </span>
    </div>
  );
}
