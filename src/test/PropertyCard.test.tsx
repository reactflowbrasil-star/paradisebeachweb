import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import PropertyCard from "@/components/PropertyCard";
import { properties } from "@/data/properties";
import type { Property } from "@/hooks/useProperties";

const mockProperty: Property = { ...properties[0], whatsapp: "" };

describe("PropertyCard", () => {
  it("renders property title", () => {
    render(
      <BrowserRouter>
        <PropertyCard property={mockProperty} />
      </BrowserRouter>
    );

    expect(screen.getByText(mockProperty.title)).toBeInTheDocument();
  });

  it("renders price as negotiable via WhatsApp", () => {
    render(
      <BrowserRouter>
        <PropertyCard property={mockProperty} />
      </BrowserRouter>
    );

    expect(screen.getByText("Negociar via WhatsApp")).toBeInTheDocument();
  });

  it("renders property location", () => {
    render(
      <BrowserRouter>
        <PropertyCard property={mockProperty} />
      </BrowserRouter>
    );

    expect(
      screen.getByText(`${mockProperty.location}, ${mockProperty.city} - ${mockProperty.state}`),
    ).toBeInTheDocument();
  });

  it("has correct link to property detail", () => {
    render(
      <BrowserRouter>
        <PropertyCard property={mockProperty} />
      </BrowserRouter>
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", `/imovel/${mockProperty.id}`);
  });
});
