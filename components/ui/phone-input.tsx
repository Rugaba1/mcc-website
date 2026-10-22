"use client";

import * as React from "react";
import * as RPNInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type PhoneInputProps = Omit<
    React.ComponentProps<"input">,
    "onChange" | "value" | "ref"
> &
    Omit<RPNInput.Props<typeof RPNInput.default>, "onChange"> & {
        onChange?: (value: RPNInput.Value) => void;
    };

const PhoneInput = React.forwardRef<
    React.ElementRef<typeof RPNInput.default>,
    PhoneInputProps
>(({ className, onChange, value, ...props }, ref) => (
    <RPNInput.default
        ref={ref}
        className={cn("flex", className)}
        flagComponent={FlagComponent}
        countrySelectComponent={CountrySelect}
        inputComponent={InputComponent}
        smartCaret={false}
        value={value || undefined}
        onChange={(v) => onChange?.(v || ("" as RPNInput.Value))}
        {...props}
    />
));
PhoneInput.displayName = "PhoneInput";

const InputComponent = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
    ({ className, ...props }, ref) => (
        <Input className={cn(className)} {...props} ref={ref} />
    ),
);
InputComponent.displayName = "InputComponent";

type CountryEntry = { label: string; value: RPNInput.Country | undefined };

type CountrySelectProps = {
    disabled?: boolean;
    value: RPNInput.Country;
    options: CountryEntry[];
    onChange: (country: RPNInput.Country) => void;
};

function CountrySelect({ disabled, value: selectedCountry, options, onChange }: CountrySelectProps) {
    const [open, setOpen] = React.useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className="flex gap-1  border-r-0 px-3 focus:z-10"
                    disabled={disabled}
                >
                    <FlagComponent country={selectedCountry} countryName={selectedCountry} />
                    <ChevronsUpDown className={cn("-mr-2 size-4 opacity-50", disabled && "hidden")} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-75 p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search country..." />
                    <CommandList className="max-h-64 overflow-y-auto">
                        <CommandEmpty>No country found.</CommandEmpty>
                        <CommandGroup>
                            {options
                                .filter((x) => x.value)
                                .map((option) => (
                                    <CommandItem
                                        key={option.value}
                                        value={`${option.label} ${option.value}`}
                                        className="gap-2 cursor-pointer"
                                        onSelect={() => {
                                            onChange(option.value!);
                                            setOpen(false);
                                        }}
                                    >
                                        <FlagComponent country={option.value!} countryName={option.label} />
                                        <span className="flex-1 text-sm">{option.label}</span>
                                        <span className="text-sm text-muted-foreground">
                                            {`+${RPNInput.getCountryCallingCode(option.value!)}`}
                                        </span>
                                        <Check
                                            className={cn(
                                                "ml-auto size-4",
                                                option.value === selectedCountry ? "opacity-100" : "opacity-0",
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

function FlagComponent({ country, countryName }: RPNInput.FlagProps) {
    const Flag = flags[country];
    return (
        <span className="flex h-4 w-6 overflow-hidden   [&_svg]:size-full">
            {Flag && <Flag title={countryName} />}
        </span>
    );
}

export { PhoneInput };