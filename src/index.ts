// Components
export { default as SbContainer } from './components/SbContainer.vue';
export { default as SbReference } from './components/SbReference.vue';
export { default as SbFloating } from './components/SbFloating.vue';

// Composables
export { useSbFloating } from './composables/useSbFloating';

// Types
export type {
  SbContainerProps,
  SbContainerSlotProps,
  SbContainerExposed,
  SbReferenceProps,
  SbFloatingProps,
  SbTrigger,
  SbPlacement,
  SbSide,
  SbAlignment,
  SbStrategy,
  SbFloatingRole,
  SbOpenReason,
  SbCloseReason,
  UseSbFloatingReturn,
} from './types';
