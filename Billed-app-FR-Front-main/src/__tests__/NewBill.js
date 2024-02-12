/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import mockStore from "../__mocks__/store";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      jest.mock("../app/store", () => mockStore);
      jest.spyOn(mockStore, "bills");
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "e@e",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();

      const storeCreateMock = jest.fn(() =>
        Promise.resolve({
          fileUrl: "https://localhost:3456/images/test.jpg",
          key: "1234",
        })
      );

      const storeUpdateMock = jest.fn(() =>
        Promise.resolve({
          id: "47qAXb6fIm2zOKkLzMro",
          vat: "80",
          fileUrl:
            "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
          status: "pending",
          type: "Hôtel et logement",
          commentary: "séminaire billed",
          name: "encore",
          fileName: "preview-facture-free-201801-pdf-1.jpg",
          date: "2004-04-04",
          amount: 400,
          commentAdmin: "ok",
          email: "a@a",
          pct: 20,
        })
      );

      mockStore.bills.mockImplementationOnce(() => ({
        create: storeCreateMock,
        update: storeUpdateMock,
      }));
    });
    afterEach(() => {
      jest.clearAllMocks();
      document.body.innerHTML = ""; // Clear the document body after each test
    });
    describe("And want to fill the form", () => {
      test("Then the data are saved if the file is valid", async () => {
        window.onNavigate(ROUTES_PATH.NewBill);

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        document.body.innerHTML = NewBillUI();

        const store = mockStore;
        const newBill = new NewBill({
          document,
          onNavigate,
          store,
          localStorage: window.localStorage,
        });

        await waitFor(() => screen.getByTestId("file"));
        const handleChangeFile = jest.spyOn(newBill, "handleChangeFile");

        const fileInput = screen.getByTestId("file");
        const pngFile = new File(["image"], "image.png", {
          type: "image/png",
        });

        fileInput.addEventListener("change", handleChangeFile);
        userEvent.upload(fileInput, pngFile);

        expect(handleChangeFile).toHaveBeenCalled();
      });

      test("Then I received an alert message if the file upload is not an image", async () => {
        window.onNavigate(ROUTES_PATH.NewBill);

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        document.body.innerHTML = NewBillUI();

        const store = mockStore;
        const newBill = new NewBill({
          document,
          onNavigate,
          store,
          localStorage: window.localStorage,
        });

        await waitFor(() => screen.getByTestId("file"));
        const handleChangeFile = jest.spyOn(newBill, "handleChangeFile");
        jest.spyOn(window, "alert").mockImplementation(() => {});

        const fileInput = screen.getByTestId("file");
        const pdfFile = new File(["image"], "not-an-image.pdf", {
          type: "file/pdf",
        });

        userEvent.upload(fileInput, pdfFile);

        expect(handleChangeFile).toBeTruthy();
        expect(window.alert).toHaveBeenCalledWith(
          "Document invalide. Veuillez transmettre le justificatif uniquement en format image."
        );
      });
    });

    test("Then I can submit the newBill", () => {
      window.onNavigate(ROUTES_PATH.NewBill);

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      document.body.innerHTML = NewBillUI();

      const store = mockStore;
      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      const handleSubmit = jest.spyOn(newBill, "handleSubmit");

      const formNewBill = screen.getByTestId("form-new-bill");
      formNewBill.addEventListener("submit", handleSubmit);
      fireEvent.submit(formNewBill);
      expect(handleSubmit).toHaveBeenCalled();
    });

    test("Then I can see if the server get the response", async () => {
      jest.setTimeout(10000);
      const request = require("supertest");
      const app = require("../../../Billed-app-FR-Back-main/app.js");
      const jwt = require("../../../Billed-app-FR-Back-main/services/jwt");

      const jwtValue = jwt.encrypt({
        userId: 2,
        email: "john-wick@domain.tld",
      });

      return request(app)
        .post("/bills")
        .set("Authorization", `Bearer ${jwtValue}`)
        .then((response) => {
          expect(response).toBeDefined();
        });
    });
  });
});
