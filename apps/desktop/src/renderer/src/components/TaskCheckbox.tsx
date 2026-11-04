import * as Checkbox from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

type TaskCheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
};

export function TaskCheckbox({ checked, onCheckedChange, label }: TaskCheckboxProps) {
  return (
    <Checkbox.Root
      checked={checked}
      onCheckedChange={(value) => onCheckedChange(value === true)}
      aria-label={label}
      className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[6px] border border-line bg-panel text-white transition-colors data-[state=checked]:border-accent data-[state=checked]:bg-accent"
    >
      <Checkbox.Indicator>
        <Check size={12} strokeWidth={3} />
      </Checkbox.Indicator>
    </Checkbox.Root>
  );
}
