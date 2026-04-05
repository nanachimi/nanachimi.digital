"use client";

import React from "react";
import PhoneInputBase from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function PhoneInput({
  value,
  onChange,
  placeholder = "+49 ...",
  className,
}: PhoneInputProps) {
  return (
    <div className={cn("phone-input-dark", className)}>
      <PhoneInputBase
        international
        defaultCountry="DE"
        value={value}
        onChange={(val) => onChange(val ?? "")}
        placeholder={placeholder}
        className="phone-input-container"
      />
      <style jsx global>{`
        .phone-input-dark .PhoneInput {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .phone-input-dark .PhoneInputCountry {
          display: flex;
          align-items: center;
          padding: 0 8px;
          height: 40px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          cursor: pointer;
        }

        .phone-input-dark .PhoneInputCountry:hover {
          border-color: rgba(255, 198, 44, 0.3);
        }

        .phone-input-dark .PhoneInputCountrySelect {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
          z-index: 1;
        }

        .phone-input-dark .PhoneInputCountrySelect option {
          background: #1a1d24;
          color: #fff;
        }

        .phone-input-dark .PhoneInputCountryIcon {
          width: 24px;
          height: 18px;
        }

        .phone-input-dark .PhoneInputCountryIcon--border {
          box-shadow: none;
        }

        .phone-input-dark .PhoneInputCountrySelectArrow {
          display: block;
          width: 6px;
          height: 6px;
          margin-left: 6px;
          border-style: solid;
          border-color: #8B8F97;
          border-top-width: 0;
          border-right-width: 1px;
          border-bottom-width: 1px;
          border-left-width: 0;
          transform: rotate(45deg);
          opacity: 0.7;
        }

        .phone-input-dark .PhoneInputInput {
          flex: 1;
          height: 40px;
          width: 100%;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.04);
          padding: 0 12px;
          font-size: 14px;
          color: #fff;
          outline: none;
          transition: border-color 0.15s ease;
        }

        .phone-input-dark .PhoneInputInput::placeholder {
          color: #5a5e66;
        }

        .phone-input-dark .PhoneInputInput:focus {
          border-color: rgba(255, 198, 44, 0.5);
        }
      `}</style>
    </div>
  );
}
