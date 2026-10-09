import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import { THUMB_POSE, gsap, intro, pose, resetSpin, spin, spinWeight } from '../lib/choreography';
import Mockup from './mockups/Mockup';
import SoftShadow from './SoftShadow';

const MODEL_HEIGHT = 3.3; // world units, roughly every mockup's height
const { lerp } = THREE.MathUtils;

/**
 * The 3D mockup that travels through the page.
 *
 * When a model is picked, `flight` describes the swap: the incoming model
 * flies from the picked circle (`flight.rect`) to the main spot while the
 * outgoing one flies from the main spot into that circle.
 */
export default function Protagonist({ model, flight, onFlightDone, shadowColor, reducedMotion, onReady }) {
  const travel = useRef();
  const pitch = useRef();
  const turn = useRef();
  const tilt = useRef();
  const outgoing = useRef();
  const fly = useRef({ t: 1 });
  const flightRef = useRef(flight);
  flightRef.current = flight;
  const { viewport } = useThree();

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  useEffect(() => {
    if (!flight) return;
    fly.current.t = 0;
    const tween = gsap.to(fly.current, { t: 1, duration: 1.2, ease: 'power3.inOut', onComplete: onFlightDone });
    return () => tween.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flight?.key]);

  useFrame((state, delta) => {
    const narrow = viewport.aspect < 0.8;
    const halfW = viewport.width / 2;
    const halfH = viewport.height / 2;
    // On portrait screens the object can't sit beside the copy, so it lives
    // in the upper half (copy sits at the bottom) and drifts less sideways.
    const xRange = narrow ? 0.3 : 1;
    const yShift = narrow ? halfH * 0.3 * pose.m : 0;
    const base = narrow ? Math.min(0.7, viewport.width / 4.2) * pose.ms : 1;
    const k = intro.v;

    const main = {
      x: pose.x * halfW * xRange + (narrow ? pose.mx * halfW : 0),
      y: pose.y * halfH * (narrow ? 0.3 : 1) + yShift,
      s: pose.scale * base * (0.6 + 0.4 * k),
    };

    // Free 360° spin (both axes) only counts in the showcase and at 100%
    // scroll; in between it eases back to face-on.
    const w = spinWeight();
    if (w === 0 && (spin.target || spin.pitchTarget)) resetSpin();
    spin.current = THREE.MathUtils.damp(spin.current, spin.target, 6, delta);
    spin.pitch = THREE.MathUtils.damp(spin.pitch, spin.pitchTarget, 6, delta);
    const yaw = pose.rotY - (1 - k) * Math.PI + spin.current * w;
    const tiltX = spin.pitch * w;

    const f = flightRef.current;
    if (f) {
      const t = fly.current.t;
      const r = f.rect;
      const slot = {
        x: ((r.x + r.width / 2) / window.innerWidth) * 2 * halfW - halfW,
        y: halfH - ((r.y + r.height / 2) / window.innerHeight) * 2 * halfH,
        s: ((THUMB_POSE.fill * r.height) / window.innerHeight) * (viewport.height / MODEL_HEIGHT),
      };
      // Incoming: circle → main spot.
      travel.current.position.set(lerp(slot.x, main.x, t), lerp(slot.y, main.y, t), 0);
      travel.current.scale.setScalar(lerp(slot.s, main.s, t));
      pitch.current.rotation.x = lerp(THUMB_POSE.pitch, tiltX, t);
      turn.current.rotation.set(0, lerp(THUMB_POSE.yaw, yaw, t), lerp(0, pose.rotZ, t));
      // Outgoing: main spot → circle.
      if (outgoing.current) {
        outgoing.current.position.set(lerp(main.x, slot.x, t), lerp(main.y, slot.y, t), 0);
        outgoing.current.scale.setScalar(lerp(main.s, slot.s, t));
        outgoing.current.rotation.set(lerp(tiltX, THUMB_POSE.pitch, t), lerp(yaw, THUMB_POSE.yaw, t), 0);
      }
    } else {
      travel.current.position.set(main.x, main.y, 0);
      travel.current.scale.setScalar(main.s);
      pitch.current.rotation.x = tiltX;
      turn.current.rotation.set(0, yaw, pose.rotZ);
    }

    // Gentle pointer parallax elsewhere, so it never turns away.
    const { x, y } = state.pointer;
    tilt.current.rotation.y = lerp(tilt.current.rotation.y, x * 0.25 * (1 - w), 0.08);
    tilt.current.rotation.x = lerp(tilt.current.rotation.x, -y * 0.15 * (1 - w), 0.08);
  });

  return (
    <>
      <group ref={travel}>
        <group ref={pitch}>
          <group ref={turn}>
            <Float speed={reducedMotion ? 0 : 2} rotationIntensity={0.4} floatIntensity={reducedMotion ? 0 : 1}>
              <group ref={tilt}>
                <Mockup key={model.id} model={model} />
              </group>
            </Float>
          </group>
        </group>
        <SoftShadow color={shadowColor} opacity={0.22} />
      </group>
      {flight && (
        <group ref={outgoing}>
          <Mockup key={flight.outgoing.id} model={flight.outgoing} />
        </group>
      )}
    </>
  );
}
