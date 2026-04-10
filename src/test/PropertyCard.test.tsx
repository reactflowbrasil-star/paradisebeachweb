import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import PropertyCard from "@/components/PropertyCard";
import { properties } from "@/data/properties";

const mockProperty = properties[0];

describe("PropertyCard", () => {
  it("renders property title", () => {
    render(
      <BrowserRouter>
        <PropertyCard property={mockProperty} />
      </BrowserRouter>
    );

    expect(screen.getByText(mockProperty.title)).toBeInTheDocument();
  });

  it("renders property price", () => {
    render(
      <BrowserRouter>
        <PropertyCard property={mockProperty} />
      </BrowserRouter>
    );

    const formattedPrice = `R$ ${mockProperty.price.toLocaleString("pt-BR")}`;
    expect(screen.getByText(formattedPrice)).toBeInTheDocument();
  });

  it("renders property location", () => {
    render(
      <BrowserRouter>
        <PropertyCard property={mockProperty} />
      </BrowserRouter>
    );

    expect(screen.getByText(`${mockProperty.location}, ${mockProperty.city}`)).toBeInTheDocument();
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