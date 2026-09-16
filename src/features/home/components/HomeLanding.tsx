import HeroSection from './HeroSection';

type HomeNavigate = (tab: string, id?: string | number) => void;

export type HomeLandingFullProps = {
  variant?: 'full';
  hoveredFeature: string | null;
  onNavigate: HomeNavigate;
  onPreviewMouseEnter: () => void;
  onPreviewMouseLeave: () => void;
};

export type HomeLandingMinimalProps = {
  variant: 'minimal';
};

export type HomeLandingProps = HomeLandingFullProps | HomeLandingMinimalProps;

export default function HomeLanding(props: HomeLandingProps) {
  return (
    <>
      <HeroSection />
    </>
  );
}
