import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../src/app/App';
import { officeLayout } from '../src/data/officeLayout';
import * as scenePlacement from '../src/utils/scenePlacement';

type FutureLayout = {
  assetAnchors: {
    sourceCanvas: { width: number; height: number };
    furniture: {
      deskChairBack: { path: string };
      deskFront: { path: string };
      artifactHub: {
        screenRectSource: { x: number; y: number; width: number; height: number };
      };
    };
  };
  desks: Array<{ id: string; online: boolean; seatAnchor: { x: number; y: number } }>;
};

const task41Layout = officeLayout as unknown as FutureLayout;
const sourceRectToAssetRelativeStyle = (scenePlacement as unknown as {
  sourceRectToAssetRelativeStyle: (rect: { x: number; y: number; width: number; height: number }, canvas: { width: number; height: number }) => Record<string, string>;
}).sourceRectToAssetRelativeStyle;

describe('Task 4.1 static map calibration', () => {
  it('converts a source rectangle to asset-relative percentages', () => {
    expect(sourceRectToAssetRelativeStyle(
      { x: 125.4, y: 313.5, width: 627, height: 940.5 },
      { width: 1254, height: 1254 },
    )).toEqual({
      height: '75%',
      left: '10%',
      top: '25%',
      width: '50%',
    });
  });

  it('provides full-canvas desk layers, seat anchors, and a Hub screen rect in layout data', () => {
    expect(task41Layout.assetAnchors.furniture.deskChairBack.path).toBe('images/furniture/desk-chair-back.png');
    expect(task41Layout.assetAnchors.furniture.deskFront.path).toBe('images/furniture/desk-front.png');
    expect(task41Layout.assetAnchors.furniture.artifactHub.screenRectSource).toMatchObject({ x: 464, y: 342 });
    expect(task41Layout.desks).toHaveLength(10);
    expect(task41Layout.desks.every((desk) => Number.isFinite(desk.seatAnchor.x) && Number.isFinite(desk.seatAnchor.y))).toBe(true);
  });

  it('layers every online desk as chair, seated Avatar, and desk front while offline desks have no Avatar', () => {
    render(<App />);

    for (const desk of task41Layout.desks) {
      expect(screen.getByTestId(`desk-chair-${desk.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`desk-front-${desk.id}`)).toBeInTheDocument();
      if (desk.online) {
        expect(screen.getByTestId(`avatar-${desk.id}`)).toBeInTheDocument();
      } else {
        expect(screen.queryByTestId(`avatar-${desk.id}`)).not.toBeInTheDocument();
      }
    }
  });

  it('uses the Hub screen rect for a clipped metrics panel', () => {
    render(<App />);

    const panel = screen.getByTestId('artifact-hub-screen');
    expect(panel).toHaveStyle({ overflow: 'hidden' });
    expect(panel).toHaveStyle(sourceRectToAssetRelativeStyle(
      task41Layout.assetAnchors.furniture.artifactHub.screenRectSource,
      task41Layout.assetAnchors.sourceCanvas,
    ));
    expect(panel).toHaveTextContent('PRD');
    expect(panel).toHaveTextContent('Feature');
    expect(panel).toHaveTextContent('Report');
  });

  it('expands a Workspace roster and its Today Output artifact list one level at a time', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Dev Office overview' }));
    const people = screen.getByRole('button', { name: 'Developers 3 / 4' });
    expect(screen.queryByText('Jack Online')).not.toBeInTheDocument();
    fireEvent.click(people);
    expect(screen.getByText('Jack Online')).toBeInTheDocument();
    expect(screen.getByText('Mia Offline')).toBeInTheDocument();

    const output = screen.getByRole('button', { name: 'Features In Progress 3' });
    expect(screen.queryByRole('button', { name: 'Account Security Feature v1.0' })).not.toBeInTheDocument();
    fireEvent.click(output);
    fireEvent.click(screen.getByRole('button', { name: 'Account Security Feature v1.0' }));
    expect(screen.getByRole('heading', { name: 'Account Security Feature v1.0' })).toBeInTheDocument();
  });

  it('describes report handoff storage at Artifact Hub', () => {
    render(<App />);

    expect(screen.getByText('Quinn submitted Login Regression Report to Artifact Hub')).toBeInTheDocument();
    expect(screen.queryByText('Quinn submitted Login Regression Report to PM Office')).not.toBeInTheDocument();
  });
});
