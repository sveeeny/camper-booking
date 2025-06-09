// utils/eventBus.ts
import mitt from 'mitt';

type Events = {
  'booking-updated': void;
};

const emitter = mitt<Events>();

export default emitter;
