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
      window.onNavigate(ROUTES_PATH.NewBill);
    });

    describe("And want to fill the form", () => {
      test("Then I can upload a valid image type file", async () => {
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

      const mockFunction = jest.fn();

      const handleSubmit = jest
        .spyOn(newBill, "handleSubmit")
        .mockImplementation(mockFunction);

      const formNewBill = screen.getByTestId("form-new-bill");
      formNewBill.addEventListener("submit", handleSubmit);
      fireEvent.submit(formNewBill);
      expect(handleSubmit).toHaveBeenCalled();
    });

    //tests POST
    describe("Tests for server responses", () => {
      let errorSpy;

      beforeEach(() => {
        errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      });

      afterEach(() => {
        errorSpy.mockRestore(); // Restore the mock after each test
      });
      test("Then we logged a console.log when the server send a 200 HTTP request", async () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        document.body.innerHTML = NewBillUI();

        mockStore.bills.mockImplementationOnce(() => {
          return {
            create: () => {
              return Promise.resolve({
                fileUrl: "https://localhost:3456/images/test.jpg",
                key: "1234",
              });
            },
          };
        });

        const store = mockStore;
        const newBill = new NewBill({
          document,
          onNavigate,
          store,
          localStorage: window.localStorage,
        });

        await waitFor(() => screen.getByTestId("file"));
        const handleChangeFile = jest.spyOn(newBill, "handleChangeFile");

        const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        const fileInput = screen.getByTestId("file");
        const pngFile = new File(["image"], "is-an-image.png", {
          type: "image/png",
        });

        userEvent.upload(fileInput, pngFile);

        await waitFor(() => {
          expect(logSpy).toHaveBeenCalled();
          const logArg = console.log.mock.calls[0][0];

          expect(logArg).toBe("https://localhost:3456/images/test.jpg");
        });
      });

      test("Then we logged an error if the server answer an error 404", async () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        document.body.innerHTML = NewBillUI();

        mockStore.bills.mockImplementationOnce(() => {
          return {
            create: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });

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
        const pngFile = new File(["image"], "is-an-image.png", {
          type: "image/png",
        });

        userEvent.upload(fileInput, pngFile);

        await waitFor(() => {
          expect(errorSpy).toHaveBeenCalled();
          const errorArg = console.error.mock.calls[0][0];

          expect(errorArg).toBeInstanceOf(Error);
          expect(errorArg.message).toBe("Erreur 404");
        });
      });

      test("Then we logged an error if the server answer an error 500", async () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        document.body.innerHTML = NewBillUI();

        mockStore.bills.mockImplementationOnce(() => {
          return {
            create: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

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
        const pngFile = new File(["image"], "is-an-image.png", {
          type: "image/png",
        });

        userEvent.upload(fileInput, pngFile);

        await waitFor(() => {
          expect(errorSpy).toHaveBeenCalled();
          const errorArg = console.error.mock.calls[0][0];

          expect(errorArg).toBeInstanceOf(Error);
          expect(errorArg.message).toBe("Erreur 500");
        });
      });
    });
  });
});
