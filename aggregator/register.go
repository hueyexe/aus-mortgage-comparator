package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

type BankBrand struct {
	BrandName string
	BaseURL   string
}

func fetchBankBrands(ctx context.Context, client *http.Client) ([]BankBrand, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", "https://api.cdr.gov.au/cdr-register/v1/banking/data-holders/brands/summary", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("x-v", "2")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("register API returned %d", resp.StatusCode)
	}

	var result RegisterResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	var brands []BankBrand
	for _, dh := range result.Data {
		if dh.PublicBaseUri == "" {
			continue
		}
		hasBanking := false
		for _, ind := range dh.Industries {
			if strings.EqualFold(ind, "banking") {
				hasBanking = true
				break
			}
		}
		if !hasBanking {
			continue
		}
		brands = append(brands, BankBrand{
			BrandName: dh.BrandName,
			BaseURL:   strings.TrimRight(dh.PublicBaseUri, "/"),
		})
	}
	return brands, nil
}
