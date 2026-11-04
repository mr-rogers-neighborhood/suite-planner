import type { Capacity } from "@gradient/core";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { CapacityMeter } from "./CapacityMeter";

const meta = {
  title: "Day/CapacityMeter",
  component: CapacityMeter,
  decorators: [
    (Story) => (
      <div className="w-[420px] bg-canvas p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CapacityMeter>;

export default meta;
type Story = StoryObj<typeof meta>;

const comfortable: Capacity = {
  plannedMinutes: 120,
  availableMinutes: 300,
  remainingMinutes: 180,
  ratio: 0.4,
  state: "comfortable",
};

const tight: Capacity = {
  plannedMinutes: 270,
  availableMinutes: 300,
  remainingMinutes: 30,
  ratio: 0.9,
  state: "tight",
};

const over: Capacity = {
  plannedMinutes: 360,
  availableMinutes: 300,
  remainingMinutes: -60,
  ratio: 1.2,
  state: "over",
};

export const Comfortable: Story = { args: { capacity: comfortable } };
export const Tight: Story = { args: { capacity: tight } };
export const Overbooked: Story = { args: { capacity: over } };
