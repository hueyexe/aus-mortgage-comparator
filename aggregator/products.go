package main

import (
	"context"
	"encoding/json"
	"fmt"
	"mime"
	"net/http"
	"strconv"
	"strings"
)

var validRateTypes = map[string]bool{
	"FIXED":                    true,
	"VARIABLE":                 true,
	"INTRODUCTORY":             true,
	"BUNDLE_DISCOUNT_FIXED":    true,
	"BUNDLE_DISCOUNT_VARIABLE": true,
}

// normalizeLVR handles banks that report LVR as whole numbers (80) vs decimals (0.80).
func normalizeLVR(v float64) float64 {
	if v > 1 {
		return v / 100
	}
	return v
}

func fetchBankRates(ctx context.Context, client *http.Client, brand BankBrand) ([]MortgageRate, error) {
	products, err := fetchProducts(ctx, client, brand.BaseURL)
	if err != nil {
		return nil, err
	}

	var rates []MortgageRate
	for _, p := range products {
		if p.IsTailored {
			continue
		}
		detail, err := fetchProductDetail(ctx, client, brand.BaseURL, p.ProductID)
		if err != nil {
			continue // skip individual product errors
		}
		for _, lr := range detail.LendingRates {
			if !validRateTypes[lr.LendingRateType] {
				continue
			}
			rate, _ := strconv.ParseFloat(lr.Rate, 64)
			compRate, _ := strconv.ParseFloat(lr.ComparisonRate, 64)

			var lvrMin, lvrMax float64
			for _, t := range lr.Tiers {
				if t.UnitOfMeasure == "PERCENT" {
					lvrMin = normalizeLVR(t.MinimumValue)
					lvrMax = normalizeLVR(t.MaximumValue)
					break
				}
			}

			fixedTerm := ""
			if lr.LendingRateType == "FIXED" {
				fixedTerm = lr.AdditionalValue
			}

			bankName := brand.BrandName
			if p.BrandName != "" {
				bankName = p.BrandName
			}

			rates = append(rates, MortgageRate{
				BankName:       bankName,
				BrandGroup:     p.Brand,
				ProductName:    p.Name,
				ProductID:      p.ProductID,
				Description:    p.Description,
				RateType:       lr.LendingRateType,
				Rate:           rate,
				ComparisonRate: compRate,
				RepaymentType:  lr.RepaymentType,
				LoanPurpose:    lr.LoanPurpose,
				LvrMin:         lvrMin,
				LvrMax:         lvrMax,
				FixedTerm:      fixedTerm,
				IsTailored:     p.IsTailored,
				LastUpdated:    p.LastUpdated,
			})
		}
	}
	return rates, nil
}

func fetchProducts(ctx context.Context, client *http.Client, baseURL string) ([]BankingProductV6, error) {
	var all []BankingProductV6
	page := 1
	for {
		url := fmt.Sprintf("%s/cds-au/v1/banking/products?product-category=RESIDENTIAL_MORTGAGES&page-size=100&page=%d", baseURL, page)

		resp, err := doProductsRequest(ctx, client, url, "4")
		if err != nil {
			return nil, err
		}
		// Retry with v3 on 406 (bank doesn't support v4 yet)
		if resp.StatusCode == http.StatusNotAcceptable {
			_ = resp.Body.Close()
			resp, err = doProductsRequest(ctx, client, url, "3")
			if err != nil {
				return nil, err
			}
		}
		if resp.StatusCode != http.StatusOK {
			_ = resp.Body.Close()
			if resp.StatusCode == http.StatusNotFound {
				return nil, fmt.Errorf("products endpoint not found (404) for %s — API may be deprecated or unavailable", baseURL)
			}
			if resp.StatusCode == http.StatusNotAcceptable {
				return nil, fmt.Errorf("products API version not supported (406) for %s", baseURL)
			}
			return nil, fmt.Errorf("products API returned %d for %s", resp.StatusCode, baseURL)
		}

		contentType := resp.Header.Get("Content-Type")
		mediaType, _, err := mime.ParseMediaType(contentType)
		if err != nil || !strings.HasPrefix(mediaType, "application/json") && !strings.HasPrefix(mediaType, "text/json") {
			_ = resp.Body.Close()
			return nil, fmt.Errorf("expected JSON response, got %q for %s", contentType, baseURL)
		}

		var result ProductsResponse
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			_ = resp.Body.Close()
			return nil, err
		}
		_ = resp.Body.Close()
		all = append(all, result.Data.Products...)

		if result.Links.Next == "" || len(result.Data.Products) == 0 {
			break
		}
		page++
	}
	return all, nil
}

func doProductsRequest(ctx context.Context, client *http.Client, url, version string) (*http.Response, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("x-v", version)
	return client.Do(req)
}

func fetchProductDetail(ctx context.Context, client *http.Client, baseURL, productID string) (*BankingProductDetailV7, error) {
	url := fmt.Sprintf("%s/cds-au/v1/banking/products/%s", baseURL, productID)

	for _, version := range []string{"6", "5", "4"} {
		req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
		if err != nil {
			return nil, err
		}
		req.Header.Set("x-v", version)
		req.Header.Set("x-min-v", "4")

		resp, err := client.Do(req)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()

		if resp.StatusCode == http.StatusNotAcceptable || resp.StatusCode == http.StatusNotFound {
			continue
		}

		if resp.StatusCode != http.StatusOK {
			return nil, fmt.Errorf("product detail API returned %d for product %s", resp.StatusCode, productID)
		}

		contentType := resp.Header.Get("Content-Type")
		mediaType, _, err := mime.ParseMediaType(contentType)
		if err != nil || !strings.HasPrefix(mediaType, "application/json") && !strings.HasPrefix(mediaType, "text/json") {
			return nil, fmt.Errorf("expected JSON response, got %q for product %s", contentType, productID)
		}

		var result ProductDetailResponse
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data.BankingProductDetailV7, nil
	}

	return nil, fmt.Errorf("product detail API failed for product %s after trying versions 6, 5, 4", productID)
}
