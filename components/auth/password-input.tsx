"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export function PasswordInput(props: React.ComponentProps<typeof Input>) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <Input {...props} type={show ? "text" : "password"} className="pr-10" />
            <Button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide password" : "Show password"}
                variant={"ghost"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
        </div>
    );
}