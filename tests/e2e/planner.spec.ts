import { test, expect, type Page } from "@playwright/test";
async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("아이디", { exact: true }).fill("fixture_a");
  await page
    .getByLabel("비밀번호", { exact: true })
    .fill("fixture-only-password");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "대구 → 나리타 → 도쿄 → 센다이",
      exact: true,
    }),
  ).toBeVisible();
}
async function menu(page: Page, name: string) {
  await page.getByRole("button", { name: "더보기", exact: true }).click();
  await page.getByRole("button", { name, exact: true }).click();
}
test.beforeEach(async ({ request }) => {
  await request.post("http://127.0.0.1:3101/test/reset");
});
test("protects routes and rejects wrong credentials without signup", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/login/);
  await expect(page.getByRole("button", { name: /가입/ })).toHaveCount(0);
  await page.getByLabel("아이디", { exact: true }).fill("fixture_a");
  await page.getByLabel("비밀번호", { exact: true }).fill("wrong");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page.locator(".error[role=alert]")).toContainText(
    "아이디 또는 비밀번호",
  );
  expect((await request.get("/api/data")).ok()).toBe(false);
});
test("mobile schedule, packing, reservation, spending and Places flows", async ({
  page,
}) => {
  await login(page);
  await expect(page.getByText("미완료 0", { exact: true })).toHaveCount(0);
  expect(
    await page
      .locator(".dates")
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  await page.screenshot({ path: "/tmp/senkyo-today.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "일정", exact: true }).click();
  await page.getByRole("button", { name: /DAY 3/ }).click();
  await expect(page.getByText("Hayabusa 26", { exact: true })).toBeVisible();
  await expect(page.getByText("15:57~17:32", { exact: true })).toBeVisible();
  const link = page.getByRole("link", { name: "Google Maps" }).first();
  expect(await link.getAttribute("href")).toContain("travelmode=walking");
  await menu(page, "준비물");
  const firstCheckbox = page.getByRole("checkbox").first();
  await firstCheckbox.click();
  await expect(firstCheckbox).toBeChecked();
  await menu(page, "예약");
  const apa = page.locator("article").filter({
    has: page.getByRole("heading", {
      name: "APA 호텔 TKP 센다이 에키기타",
      exact: true,
    }),
  });
  await apa.getByRole("button", { name: "수정", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("예약번호", { exact: true })
    .fill("USER-ENTERED-TEST");
  await dialog
    .getByLabel("예약 확인 URL", { exact: true })
    .fill("https://example.com/confirmation");
  await dialog.getByRole("button", { name: "저장", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(apa).toContainText("USER-ENTERED-TEST");
  await menu(page, "지출 / 정산");
  await page.getByRole("button", { name: "지출 / 정산 추가" }).click();
  await dialog.getByLabel("제목 *").fill("테스트 식사");
  await dialog.getByLabel("카테고리 *").fill("음식");
  await dialog.getByLabel("지출액 (엔) *").fill("101");
  await dialog
    .getByLabel("결제자 *")
    .selectOption("11111111-1111-4111-8111-111111111111");
  await dialog.getByRole("button", { name: "저장", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByText("상대에게 보낼 금액 ¥50", { exact: true }),
  ).toBeVisible();
  await page.route("**/api/places?*", (route) =>
    route.fulfill({
      json: route.request().url().includes("q=")
        ? {
            places: [
              {
                id: "fixture-place",
                displayName: { text: "테스트 센다이 식당" },
                formattedAddress: "테스트 주소",
              },
            ],
          }
        : {
            id: "fixture-place",
            displayName: { text: "테스트 센다이 식당" },
            formattedAddress: "테스트 주소",
            rating: 4.5,
          },
    }),
  );
  await page.getByRole("button", { name: "장소", exact: true }).click();
  await page.getByLabel("장소 또는 식당 검색").fill("센다이 테스트");
  await page.getByRole("button", { name: "검색", exact: true }).click();
  await page.getByRole("button", { name: "후보 식당으로 저장" }).click();
  await expect(
    page.getByRole("heading", { name: "테스트 센다이 식당", exact: true }),
  ).toBeVisible();
  const restaurant = page.locator("article").filter({
    has: page.getByRole("heading", {
      name: "테스트 센다이 식당",
      exact: true,
    }),
  });
  await restaurant
    .getByRole("button", { name: "후보 수정 / 방문 선택" })
    .click();
  await dialog
    .getByRole("combobox", { name: "식사 일정", exact: true })
    .selectOption({ label: "2026-12-24 점심 식사" });
  await dialog.getByLabel("실제 방문 식당").check();
  await dialog.getByRole("button", { name: "저장", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(restaurant).toContainText("실제 방문");
  page.once("dialog", (d) => d.accept());
  await restaurant.getByRole("button", { name: "후보 제거" }).click();
  await expect(
    restaurant.getByRole("button", { name: "후보 제거" }),
  ).toHaveCount(0);
  await expect(restaurant).toBeVisible();
  await page.screenshot({ path: "/tmp/senkyo-mobile.png", fullPage: true });
  await menu(page, "설정");
  await page.getByRole("button", { name: "로그아웃", exact: true }).click();
  await expect(page).toHaveURL(/login/);
  expect(
    await page.evaluate(() => sessionStorage.getItem("senkyo-offline")),
  ).toBeNull();
});

test("rejects a stale edit and supports read-only offline snapshots", async ({
  page,
}) => {
  await login(page);
  await menu(page, "메모 / 회고");
  await page.getByRole("button", { name: "메모 / 회고 추가" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("제목 *").fill("공동 메모");
  await dialog
    .getByRole("textbox", { name: "메모 / 회고", exact: true })
    .fill("처음");
  await dialog.getByRole("button", { name: "저장", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole("button", { name: "수정", exact: true }).click();
  await page.evaluate(async () => {
    const data = await (await fetch("/api/data")).json();
    const row = data.notes[0];
    await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: "notes",
        id: row.id,
        updated_at: row.updated_at,
        values: { ...row, body: "다른 사용자 수정" },
      }),
    });
  });
  await dialog
    .getByRole("textbox", { name: "메모 / 회고", exact: true })
    .fill("오래된 폼");
  await dialog.getByRole("button", { name: "저장", exact: true }).click();
  await expect(dialog.locator(".error")).toContainText("다른 사용자가 수정");
  await dialog.getByRole("button", { name: "닫기", exact: true }).click();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise((resolve) =>
        navigator.serviceWorker.addEventListener("controllerchange", resolve, {
          once: true,
        }),
      );
  });
  await page.context().setOffline(true);
  await page.goto("/network-unavailable");
  await expect(
    page.getByRole("heading", { name: "오프라인 여행정보" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "예약번호", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "저장", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("입력 전", { exact: false }).first(),
  ).toBeVisible();
  await page.context().setOffline(false);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("centers dialogs, hides empty preparation sections, and saves text attachments", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("button", { name: "일정", exact: true }).click();
  const response = await page.request.get("/api/data");
  const data = (await response.json()) as import("../../src/lib/domain").Data;
  const item = data.schedule_items.find(
    (s) =>
      s.date === "2026-12-22" &&
      !data.transport_segments.some((t) => t.schedule_item_id === s.id) &&
      !data.packing_items.some((p) => p.schedule_item_id === s.id) &&
      !data.checklist_items.some((c) => c.schedule_item_id === s.id),
  );
  expect(item).toBeTruthy();
  await page
    .locator(".timeline article")
    .filter({
      has: page.getByRole("heading", {
        name: String(item!.title),
        exact: true,
      }),
    })
    .getByRole("button", { name: "상세 보기" })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "준비물", exact: true }),
  ).toHaveCount(0);
  await expect(
    dialog.getByRole("heading", { name: "체크리스트", exact: true }),
  ).toHaveCount(0);
  for (const viewport of [
    { width: 320, height: 740 },
    { width: 1280, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    const bounds = await dialog.boundingBox();
    expect(bounds).not.toBeNull();
    expect(
      Math.abs(bounds!.x + bounds!.width / 2 - viewport.width / 2),
    ).toBeLessThan(2);
    expect(
      Math.abs(bounds!.y + bounds!.height / 2 - viewport.height / 2),
    ).toBeLessThan(2);
  }
  await dialog.getByRole("button", { name: "닫기", exact: true }).click();
  await menu(page, "예약");
  const reservation = page.locator("article").filter({
    has: page.getByRole("heading", {
      name: "APA 호텔 TKP 센다이 에키기타",
      exact: true,
    }),
  });
  await reservation
    .getByLabel("텍스트 제목", { exact: true })
    .fill("체크인 안내");
  await reservation
    .getByLabel("첨부 텍스트", { exact: true })
    .fill("여권을 준비하세요.\n<script>plain text</script>");
  await reservation.getByRole("button", { name: "텍스트 첨부 저장" }).click();
  await expect(reservation.locator(".attachment-text")).toHaveText(
    "여권을 준비하세요.\n<script>plain text</script>",
  );
  await page.reload();
  await menu(page, "예약");
  await expect(reservation.locator(".attachment-text")).toContainText(
    "여권을 준비하세요.",
  );
  page.once("dialog", (d) => d.accept());
  await reservation
    .getByRole("button", { name: "체크인 안내 삭제", exact: true })
    .click();
  await expect(reservation.locator(".attachment-text")).toHaveCount(0);
});

test("opens only the linked reservation in a dialog without leaving the schedule", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("button", { name: "일정", exact: true }).click();
  const response = await page.request.get("/api/data");
  const data = (await response.json()) as import("../../src/lib/domain").Data;
  const segment = data.transport_segments.find(
    (t) => t.date === "2026-12-22" && t.reservation_id,
  );
  expect(segment).toBeTruthy();
  const reservation = data.reservations.find(
    (r) => r.id === segment!.reservation_id,
  )!;
  await page
    .getByRole("button", { name: "예약정보", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("heading", {
      name: String(reservation.title),
      exact: true,
    }),
  ).toBeVisible();
  await expect(dialog.getByLabel("첨부 텍스트", { exact: true })).toBeVisible();
  await expect(page.locator('nav button[aria-current="page"]')).toHaveText(
    "일정",
  );
  await dialog.getByRole("button", { name: "닫기", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('nav button[aria-current="page"]')).toHaveText(
    "일정",
  );
  const linked = data.schedule_items.find(
    (s) =>
      s.date === "2026-12-22" &&
      !data.transport_segments.some((t) => t.schedule_item_id === s.id) &&
      data.reservation_schedule_items.some((l) => l.schedule_item_id === s.id),
  );
  expect(linked).toBeTruthy();
  await page
    .locator(".timeline article")
    .filter({
      has: page.getByRole("heading", {
        name: String(linked!.title),
        exact: true,
      }),
    })
    .getByRole("button", { name: "상세 보기" })
    .click();
  const link = data.reservation_schedule_items.find(
    (l) => l.schedule_item_id === linked!.id,
  )!;
  const linkedReservation = data.reservations.find(
    (r) => r.id === link.reservation_id,
  )!;
  await dialog
    .getByRole("button", { name: String(linkedReservation.title), exact: true })
    .click();
  await expect(
    dialog.getByRole("heading", {
      name: String(linkedReservation.title),
      exact: true,
    }),
  ).toBeVisible();
});

test("adds connections inside a schedule, maps its places by date, and saves dragged order", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("button", { name: "일정", exact: true }).click();
  await page.getByRole("button", { name: "일정 추가", exact: true }).click();
  let dialog = page.getByRole("dialog").last();
  await expect(dialog.getByLabel("정렬 순서", { exact: false })).toHaveCount(0);
  await dialog.getByLabel("제목 *", { exact: true }).fill("새 마지막 일정");
  await dialog.getByRole("button", { name: "저장", exact: true }).click();
  await expect(page.locator(".timeline").last()).toContainText(
    "새 마지막 일정",
  );
  await page
    .locator(".timeline")
    .last()
    .getByRole("button", { name: "상세 보기" })
    .click();
  dialog = page.getByRole("dialog").last();
  await page.route("**/api/places?*", (r) =>
    r.fulfill({
      json: {
        places: [
          {
            id: "schedule-google-place",
            displayName: { text: "일정 전용 장소" },
            formattedAddress: "일정 장소 주소",
          },
        ],
      },
    }),
  );
  await dialog.getByLabel("이 일정의 장소 검색").fill("일정 장소");
  await dialog
    .getByRole("button", { name: "Google 장소 검색", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "이 일정에 장소 추가", exact: true })
    .click();
  await expect(
    dialog.getByText("일정 전용 장소", { exact: true }),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: "새 예약 추가", exact: true })
    .click();
  const editor = page.getByRole("dialog").last();
  await editor.getByLabel("제목 *", { exact: true }).fill("일정 전용 예약");
  await editor.getByLabel("예약번호", { exact: true }).fill("SCHEDULE-TEST");
  await editor.getByRole("button", { name: "저장", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "일정 전용 예약", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "닫기", exact: true })
    .click();
  await page.getByRole("button", { name: "지도", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "일정 전용 장소", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /DAY 2/ }).click();
  await expect(
    page.getByRole("heading", { name: "일정 전용 장소", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: /DAY 1/ }).click();
  await page.getByRole("button", { name: "일정", exact: true }).click();
  const original = (await (
    await page.request.get("/api/data")
  ).json()) as import("../../src/lib/domain").Data;
  const rows = original.schedule_items
    .filter((s) => s.date === "2026-12-22")
    .sort((a, b) => Number(a.sort_order) - Number(b.sort_order));
  await page.getByRole("button", { name: "순서 편집", exact: true }).click();
  dialog = page.getByRole("dialog");
  const handle = dialog.getByRole("button", {
    name: `${rows[1].title} 이동 손잡이`,
    exact: true,
  });
  const origin = await handle.boundingBox();
  const target = await dialog.locator("[data-order-id]").first().boundingBox();
  await page.mouse.move(
    origin!.x + origin!.width / 2,
    origin!.y + origin!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    target!.x + target!.width / 2,
    target!.y + target!.height / 2,
  );
  await page.mouse.up();
  await expect(dialog.locator("[data-order-id]").first()).toHaveAttribute(
    "data-order-id",
    rows[1].id,
  );
  await dialog.getByRole("button", { name: "순서 저장", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const saved = (await (
    await page.request.get("/api/data")
  ).json()) as import("../../src/lib/domain").Data;
  expect(
    saved.schedule_items
      .filter((s) => s.date === "2026-12-22")
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))[0].id,
  ).toBe(rows[1].id);
});

test("treats unconnected map places as setup and connects the existing record", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("button", { name: "지도", exact: true }).click();
  await expect(
    page.getByText("Google 장소가 연결된 위치가 없습니다.", { exact: false }),
  ).toHaveCount(0);
  await expect(
    page.getByText("이 날짜의 장소는 저장되어 있지만", { exact: false }),
  ).toBeVisible();
  const card = page
    .locator(".card")
    .filter({
      has: page.getByRole("button", { name: "Google 지점 연결", exact: true }),
    })
    .first();
  const title = await card.getByRole("heading").innerText();
  const before = (await (
    await page.request.get("/api/data")
  ).json()) as import("../../src/lib/domain").Data;
  await card
    .getByRole("button", { name: "Google 지점 연결", exact: true })
    .click();
  await expect(page.getByLabel("장소 또는 식당 검색")).toHaveValue(title);
  await page.route("**/api/places?*", (r) =>
    r.fulfill({
      json: {
        places: [
          {
            id: "existing-seed-place",
            displayName: { text: "정확한 지점" },
            location: { latitude: 35, longitude: 139 },
          },
        ],
      },
    }),
  );
  let failedOnce = false;
  await page.route("**/api/places?*", async (r) => {
    if (!failedOnce) {
      failedOnce = true;
      await r.fulfill({
        status: 502,
        json: { error: "Google 장소 서비스가 서버 IP를 차단했습니다." },
      });
    } else
      await r.fulfill({
        json: {
          places: [
            {
              id: "existing-seed-place",
              displayName: { text: "정확한 지점" },
              location: { latitude: 35, longitude: 139 },
            },
          ],
        },
      });
  });
  await page.getByRole("button", { name: "검색", exact: true }).click();
  await expect(page.locator(".error[role=alert]")).toContainText("서버 IP");
  await page.getByRole("button", { name: "재시도", exact: true }).click();
  await page
    .getByRole("button", {
      name: "선택한 장소에 Google 지점 연결",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", {
      name: "선택한 장소에 Google 지점 연결",
      exact: true,
    }),
  ).toHaveCount(0);
  const after = (await (
    await page.request.get("/api/data")
  ).json()) as import("../../src/lib/domain").Data;
  expect(after.places.length).toBe(before.places.length);
  expect(
    after.places.find((p) => p.custom_name === title)?.google_place_id,
  ).toBe("existing-seed-place");
  await page.getByRole("button", { name: "지도", exact: true }).click();
  await expect(
    page.getByText("이 날짜의 장소는 저장되어 있지만", { exact: false }),
  ).toHaveCount(0);
});
