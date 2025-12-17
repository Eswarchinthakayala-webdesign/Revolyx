import * as React from 'react';

import {
  HoverCard as HoverCardPrimitive,
  HoverCardTrigger as HoverCardTriggerPrimitive,
  HoverCardPortal as HoverCardPortalPrimitive,
  HoverCardContent as HoverCardContentPrimitive,
} from '@/components/animate-ui/primitives/radix/hover-card';
import { cn } from '@/lib/utils';

function HoverCard(props) {
  return <HoverCardPrimitive {...props} />;
}

function HoverCardTrigger(props) {
  return <HoverCardTriggerPrimitive {...props} />;
}

function HoverCardContent({
  className,
  align = 'center',
  sideOffset = 4,
  ...props
}) {
  return (
    <HoverCardPortalPrimitive>
      <HoverCardContentPrimitive
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'bg-popover text-popover-foreground z-50 w-64 origin-(--radix-hover-card-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden',
          className
        )}
        {...props} />
    </HoverCardPortalPrimitive>
  );
}

export { HoverCard, HoverCardTrigger, HoverCardContent };
