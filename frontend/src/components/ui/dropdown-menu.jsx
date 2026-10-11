// shadcn/ui Base UI Dropdown Menu를 LDA의 CSS 테마에 맞게 구성합니다.
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { Check } from "lucide-react";
import "./dropdown-menu.css";

export function DropdownMenu(props) {
  return <MenuPrimitive.Root {...props} />;
}

export function DropdownMenuTrigger(props) {
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

export function DropdownMenuContent({ align = "start", sideOffset = 6, className = "", ...props }) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner className="dropdown-menu-positioner" align={align} sideOffset={sideOffset}>
        <MenuPrimitive.Popup data-slot="dropdown-menu-content" className={`dropdown-menu-content ${className}`} {...props} />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

export function DropdownMenuGroup(props) {
  return <MenuPrimitive.Group {...props} />;
}

export function DropdownMenuLabel(props) {
  return <MenuPrimitive.GroupLabel className="dropdown-menu-label" {...props} />;
}

export function DropdownMenuSeparator(props) {
  return <MenuPrimitive.Separator className="dropdown-menu-separator" {...props} />;
}

export function DropdownMenuItem({ className = "", ...props }) {
  return <MenuPrimitive.Item className={`dropdown-menu-item ${className}`} {...props} />;
}

export function DropdownMenuRadioGroup(props) {
  return <MenuPrimitive.RadioGroup {...props} />;
}

export function DropdownMenuRadioItem({ children, ...props }) {
  return (
    <MenuPrimitive.RadioItem data-slot="dropdown-menu-radio-item" className="dropdown-menu-radio-item" {...props}>
      {children}
      <MenuPrimitive.RadioItemIndicator className="dropdown-menu-indicator">
        <Check size={16} aria-hidden="true" />
      </MenuPrimitive.RadioItemIndicator>
    </MenuPrimitive.RadioItem>
  );
}
