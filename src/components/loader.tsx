export function PlantLoader() {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-4">
        <div className="w-16 h-16">
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <style>{`
              .plant-loader__leaf {
                transform-origin: 50% 100%;
                animation: plant-loader-grow 2s ease-in-out infinite;
              }
              .plant-loader__leaf--1 { animation-delay: 0s; }
              .plant-loader__leaf--2 { animation-delay: .5s; }
              @keyframes plant-loader-grow {
                0% { transform: scale(0); opacity: 0; }
                50% { transform: scale(1); opacity: 1; }
                100% { transform: scale(0); opacity: 0; }
              }
            `}</style>
            <path d="M20 40 V 20" stroke="hsl(var(--primary))" strokeWidth="2"/>
            <path d="M20 25 C 10 20 10 10 20 10" className="plant-loader__leaf plant-loader__leaf--1" stroke="hsl(var(--primary))" fill="none" strokeWidth="2" strokeLinecap="round" />
            <path d="M20 20 C 30 15 30 5 20 5" className="plant-loader__leaf plant-loader__leaf--2" stroke="hsl(var(--primary))" fill="none" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-sm font-body text-muted-foreground animate-pulse">
          सलाह तैयार हो रही है...
        </p>
      </div>
    );
  }
  