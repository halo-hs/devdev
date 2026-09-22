import { listDeals } from "./deals";
import { withRetry } from "./retry";

import type { DealsListResponse, ListDealsParams } from "./deals";

// erp-v2-adapt: begin platform deal pages are capped at 100 while canon consumes a complete snapshot.
export const DEALS_PAGE_SIZE = 100;

export type ListAllDealsParams = Omit<ListDealsParams, "page" | "pageSize">;

export async function listAllDeals(
  getIdToken: () => Promise<string>,
  params: ListAllDealsParams = {},
): Promise<DealsListResponse> {
  const authToken = await getIdToken();
  const capturedGetIdToken = () => Promise.resolve(authToken);
  const requestPage = (page: number) =>
    withRetry(
      () => listDeals(capturedGetIdToken, { ...params, page, pageSize: DEALS_PAGE_SIZE }),
      { baseDelayMs: 500, retries: 2 },
    );

  const firstResponse = await requestPage(1);
  const byDealId = new Map(firstResponse.items.map((deal) => [deal.deal_id, deal]));
  let expectedPageCount = firstResponse.meta.page_count;
  let fetchedPageCount = 1;
  let pageItems = firstResponse.items;

  while (
    pageItems.length === DEALS_PAGE_SIZE &&
    fetchedPageCount < expectedPageCount
  ) {
    fetchedPageCount += 1;
    const response = await requestPage(fetchedPageCount);
    pageItems = response.items;
    expectedPageCount = Math.max(expectedPageCount, response.meta.page_count);
    for (const deal of pageItems) byDealId.set(deal.deal_id, deal);
  }

  return { ...firstResponse, items: [...byDealId.values()] };
}
// erp-v2-adapt: end
