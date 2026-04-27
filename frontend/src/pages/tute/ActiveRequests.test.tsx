import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ActiveRequests from "./ActiveRequests";

const mockNavigate = vi.fn();
const mockAccept = vi.fn().mockResolvedValue({});
const mockDecline = vi.fn().mockResolvedValue({});
const mockDeliver = vi.fn().mockResolvedValue({});
type RequestFixture = {
  id: number;
  studentId: number;
  studentCode?: string;
  studentName: string;
  courseName: string;
  description: string;
  status: string;
  requestedDate?: string;
  paymentStatus?: string;
  createdAt?: string;
};

let incomingRequests: RequestFixture[] = [];
let activeRequests: RequestFixture[] = [];

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/lib/api", () => ({
  useTutorProfile: () => ({
    data: { id: 7 },
    isLoading: false,
    isError: false,
  }),
  useIncomingTutorRequests: () => ({
    data: {
      content: incomingRequests,
    },
    isLoading: false,
    isError: false,
  }),
  useActiveTutorRequests: () => ({
    data: {
      content: activeRequests,
    },
    isLoading: false,
    isError: false,
  }),
  useAcceptIncomingTutorRequest: () => ({
    mutateAsync: mockAccept,
    isPending: false,
  }),
  useDeclineIncomingTutorRequest: () => ({
    mutateAsync: mockDecline,
    isPending: false,
  }),
  useMarkTutorRequestDelivered: () => ({
    mutateAsync: mockDeliver,
    isPending: false,
  }),
}));

afterEach(() => {
  mockNavigate.mockClear();
  mockAccept.mockClear();
  mockDecline.mockClear();
  mockDeliver.mockClear();
  incomingRequests = [];
  activeRequests = [];
});

describe("ActiveRequests", () => {
  it("keeps pending requests on the page until they are accepted and delivered", async () => {
    incomingRequests = [
      {
        id: 11,
        studentId: 22,
        studentCode: "STU-22",
        studentName: "Jane Doe",
        courseName: "Physics",
        description: "Exam review",
        status: "PENDING",
        requestedDate: "2026-04-17T10:00:00.000Z",
        paymentStatus: "PAID",
      },
    ];
    activeRequests = [];

    render(<ActiveRequests />);

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Accept/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Accept/i }));

    await waitFor(() => {
      expect(mockAccept).toHaveBeenCalledWith({ requestId: 11, tutorId: 7 });
    });

    expect(screen.getByRole("button", { name: /Mark as Delivered/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Mark as Delivered/i }));

    await waitFor(() => {
      expect(mockDeliver).toHaveBeenCalledWith(11);
      expect(mockNavigate).toHaveBeenCalledWith("/tute/delivery-records");
    });
  });

  it("restores accepted requests from the active feed after revisiting the page", () => {
    incomingRequests = [];
    activeRequests = [
      {
        id: 11,
        studentId: 22,
        studentCode: "STU-22",
        studentName: "Jane Doe",
        courseName: "Physics",
        description: "Exam review",
        status: "ACCEPTED",
        requestedDate: "2026-04-17T10:00:00.000Z",
        paymentStatus: "PAID",
      },
    ];

    render(<ActiveRequests />);

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Mark as Delivered/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Accept/i })).not.toBeInTheDocument();
  });

  it("opens a decline dialog and submits the entered reason", async () => {
    incomingRequests = [
      {
        id: 12,
        studentId: 33,
        studentCode: "STU-33",
        studentName: "John Smith",
        courseName: "Chemistry",
        description: "Lab support",
        status: "PENDING",
        requestedDate: "2026-04-17T11:00:00.000Z",
        paymentStatus: "PAID",
      },
    ];
    activeRequests = [];

    render(<ActiveRequests />);

    fireEvent.click(screen.getByRole("button", { name: /Decline/i }));
    fireEvent.change(screen.getByLabelText(/Reason/i), {
      target: { value: "Student requested a different tutor" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Decline Request/i }));

    await waitFor(() => {
      expect(mockDecline).toHaveBeenCalledWith({
        requestId: 12,
        reason: "Student requested a different tutor",
      });
    });
  });
});
