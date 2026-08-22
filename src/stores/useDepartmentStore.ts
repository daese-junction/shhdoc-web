import { create } from "zustand";
import { INITIAL_DEPARTMENTS, type Department } from "@/mocks/departments";

interface DepartmentState {
  departments: Department[];
  addDepartment: (name: string) => Department;
  renameDepartment: (id: number, name: string) => void;
}

// 목데이터 단계라 API 연동 전까지는 스토어 안에서만 CRUD 한다.
export const useDepartmentStore = create<DepartmentState>((set, get) => ({
  departments: INITIAL_DEPARTMENTS,

  addDepartment: (name) => {
    const department: Department = {
      id: Math.max(0, ...get().departments.map((d) => d.id)) + 1,
      name,
    };
    set((state) => ({ departments: [...state.departments, department] }));
    return department;
  },

  renameDepartment: (id, name) =>
    set((state) => ({
      departments: state.departments.map((department) =>
        department.id === id ? { ...department, name } : department
      ),
    })),
}));
