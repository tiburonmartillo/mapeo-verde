import HeroSection from './HeroSection';
import TextContentSection from './TextContentSection';
import FeatureList from './FeatureList';
import { FeaturePreview } from './FeaturePreview';
import CtaSection from './CtaSection';

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
  if (props.variant === 'minimal') {
    return (
      <>
        <HeroSection />
        <TextContentSection />
        <FeatureList />
        <CtaSection />
      </>
    );
  }

  const {
    hoveredFeature,
    onNavigate,
    onPreviewMouseEnter,
    onPreviewMouseLeave,
  } = props;

  return (
    <>
      <HeroSection />
      <TextContentSection />
      <FeatureList
        onNavigate={onNavigate}
      />
      <div className="hidden md:block">
        <FeaturePreview
          hoveredFeature={hoveredFeature}
          onMouseEnter={onPreviewMouseEnter}
          onMouseLeave={onPreviewMouseLeave}
          onNavigate={onNavigate}
        />
      </div>
      <CtaSection />
    </>
  );
}
