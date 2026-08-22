"use client";

import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import AddOutlined from "@mui/icons-material/AddOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import { Button, ConfirmModal, Input, Loading, Modal } from "@/components/common";
import { getErrorMessage } from "@/api/axios";
import { useToastStore } from "@/stores/useToastStore";
import {
  documentTypeSchema,
  policyCategorySchema,
  getFieldErrors,
  type DocumentTypeInput,
  type PolicyCategoryInput,
  type FieldErrors,
} from "@/utils/validation";
import type { DocumentType, PolicyCategory } from "@/types/policy";
import {
  createCategory,
  createDocumentType,
  deleteCategory,
  deleteDocumentType,
  listCategories,
  listDocumentTypes,
  updateCategory,
  updateDocumentType,
} from "./api";

interface CategoryForm {
  name: string;
}

const initialCategoryForm: CategoryForm = { name: "" };

interface DocumentTypeForm {
  categoryId: string;
  name: string;
  description: string;
}

const makeDocumentTypeForm = (categoryId: number): DocumentTypeForm => ({
  categoryId: String(categoryId),
  name: "",
  description: "",
});

const SELECT_CLASS =
  "h-11 w-full rounded-lg border border-border-tertiary bg-surface-primary px-3 text-base text-text-primary transition-colors focus-visible:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25 sm:h-10 sm:text-sm";

export function CategoriesTab() {
  const showToast = useToastStore((state) => state.show);

  const [categories, setCategories] = useState<PolicyCategory[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 카테고리 추가·수정 모달
  const [editingCategory, setEditingCategory] = useState<PolicyCategory | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(initialCategoryForm);
  const [categoryErrors, setCategoryErrors] = useState<FieldErrors<PolicyCategoryInput>>({});
  const [categoryFormError, setCategoryFormError] = useState<string>();
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<PolicyCategory | null>(null);
  const [isCategoryDeleting, setIsCategoryDeleting] = useState(false);

  // 문서 유형 추가·수정 모달 — 카테고리 안에 중첩해서 관리한다.
  const [editingType, setEditingType] = useState<DocumentType | null>(null);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [typeForm, setTypeForm] = useState<DocumentTypeForm>(makeDocumentTypeForm(0));
  const [typeErrors, setTypeErrors] = useState<FieldErrors<DocumentTypeInput>>({});
  const [typeFormError, setTypeFormError] = useState<string>();
  const [isTypeSubmitting, setIsTypeSubmitting] = useState(false);
  const [deletingType, setDeletingType] = useState<DocumentType | null>(null);
  const [isTypeDeleting, setIsTypeDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([listCategories(), listDocumentTypes()])
      .then(([categoryList, typeList]) => {
        if (cancelled) return;
        setCategories(categoryList);
        setDocumentTypes(typeList);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = getErrorMessage(error, {}, "카테고리를 불러오지 못했어요.");
        if (message) showToast(message, "error");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [showToast]);

  // ── 카테고리 CRUD ──────────────────────────────────────────
  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setCategoryForm(initialCategoryForm);
    setCategoryErrors({});
    setCategoryFormError(undefined);
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (category: PolicyCategory) => {
    setEditingCategory(category);
    setCategoryForm({ name: category.name });
    setCategoryErrors({});
    setCategoryFormError(undefined);
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => setIsCategoryModalOpen(false);

  const handleCategorySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // code 는 화면에 노출하지 않고 이름과 동일하게 넣는다.
    const result = policyCategorySchema.safeParse({
      code: categoryForm.name,
      name: categoryForm.name,
    });
    if (!result.success) {
      setCategoryErrors(getFieldErrors(result.error));
      return;
    }

    setCategoryErrors({});
    setCategoryFormError(undefined);
    setIsCategorySubmitting(true);

    try {
      if (editingCategory) {
        const updated = await updateCategory(editingCategory.id, result.data);
        setCategories((prev) =>
          prev.map((category) => (category.id === updated.id ? updated : category))
        );
        showToast(`${updated.name} 수정했어요.`, "success");
      } else {
        const created = await createCategory(result.data);
        setCategories((prev) => [...prev, created]);
        showToast(`${created.name} 추가했어요.`, "success");
      }
      closeCategoryModal();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setCategoryErrors((prev) => ({
          ...prev,
          name: getErrorMessage(error, { 409: "이미 쓰이는 이름이에요." }),
        }));
      } else {
        setCategoryFormError(getErrorMessage(error));
      }
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deletingCategory) return;

    setIsCategoryDeleting(true);
    try {
      await deleteCategory(deletingCategory.id);
      setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id));
      showToast(`${deletingCategory.name} 삭제했어요.`, "success");
      setDeletingCategory(null);
    } catch (error) {
      const message =
        axios.isAxiosError(error) && error.response?.status === 409
          ? "하위 문서 유형이나 이 카테고리를 조건으로 쓰는 규칙이 있어 삭제할 수 없어요."
          : getErrorMessage(error, {}, "삭제하지 못했어요.");
      showToast(message, "error");
    } finally {
      setIsCategoryDeleting(false);
    }
  };

  // ── 문서 유형 CRUD ────────────────────────────────────────
  const openAddTypeModal = (categoryId: number) => {
    setEditingType(null);
    setTypeForm(makeDocumentTypeForm(categoryId));
    setTypeErrors({});
    setTypeFormError(undefined);
    setIsTypeModalOpen(true);
  };

  const openEditTypeModal = (type: DocumentType) => {
    setEditingType(type);
    setTypeForm({
      categoryId: String(type.categoryId),
      name: type.name,
      description: type.description,
    });
    setTypeErrors({});
    setTypeFormError(undefined);
    setIsTypeModalOpen(true);
  };

  const closeTypeModal = () => setIsTypeModalOpen(false);

  const updateTypeField = (key: keyof DocumentTypeForm, value: string) =>
    setTypeForm((prev) => ({ ...prev, [key]: value }));

  const handleTypeSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // code 는 화면에 노출하지 않고 이름과 동일하게 넣는다.
    const result = documentTypeSchema.safeParse({ ...typeForm, code: typeForm.name });
    if (!result.success) {
      setTypeErrors(getFieldErrors(result.error));
      return;
    }

    setTypeErrors({});
    setTypeFormError(undefined);
    setIsTypeSubmitting(true);

    try {
      if (editingType) {
        // PUT /admin/policy/document-types/{id} — 카테고리 이동도 여기서 처리
        const updated = await updateDocumentType(editingType.id, result.data);
        setDocumentTypes((prev) =>
          prev.map((type) => (type.id === updated.id ? updated : type))
        );
        showToast(`${updated.name} 수정했어요.`, "success");
      } else {
        const created = await createDocumentType(result.data);
        setDocumentTypes((prev) => [...prev, created]);
        showToast(`${created.name} 추가했어요.`, "success");
      }
      closeTypeModal();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setTypeErrors((prev) => ({
          ...prev,
          name: getErrorMessage(error, { 409: "이미 쓰이는 이름이에요." }),
        }));
      } else if (axios.isAxiosError(error) && error.response?.status === 404) {
        setTypeFormError(getErrorMessage(error, { 404: "카테고리를 찾을 수 없어요." }));
      } else {
        setTypeFormError(getErrorMessage(error));
      }
    } finally {
      setIsTypeSubmitting(false);
    }
  };

  const confirmDeleteType = async () => {
    if (!deletingType) return;

    setIsTypeDeleting(true);
    try {
      await deleteDocumentType(deletingType.id);
      setDocumentTypes((prev) => prev.filter((type) => type.id !== deletingType.id));
      showToast(`${deletingType.name} 삭제했어요.`, "success");
      setDeletingType(null);
    } catch (error) {
      const message =
        axios.isAxiosError(error) && error.response?.status === 409
          ? "이 유형을 조건으로 쓰는 규칙이 있어 삭제할 수 없어요."
          : getErrorMessage(error, {}, "삭제하지 못했어요.");
      showToast(message, "error");
    } finally {
      setIsTypeDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-text-secondary">
          카테고리 아래에 문서 유형을 묶어서 관리해요. 설명이 구체적일수록 AI
          분류가 정확해져요.
        </p>

        <Button size="sm" onClick={openAddCategoryModal}>
          <AddOutlined fontSize="small" />
          카테고리 추가
        </Button>
      </div>

      {isLoading ? (
        <Loading />
      ) : categories.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {categories.map((category) => {
            const typesInCategory = documentTypes.filter(
              (type) => type.categoryId === category.id
            );

            return (
              <div
                key={category.id}
                className="flex flex-col gap-3 rounded-xl border border-border-tertiary p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2 text-text-tertiary">
                    <FolderOutlined fontSize="small" />
                    <span className="truncate text-[15px] font-semibold text-text-primary">
                      {category.name}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditCategoryModal(category)}
                      aria-label={`${category.name} 수정`}
                      className="grid size-7 place-items-center rounded-md text-text-tertiary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
                    >
                      <EditOutlined fontSize="small" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingCategory(category)}
                      aria-label={`${category.name} 삭제`}
                      className="grid size-7 place-items-center rounded-md text-text-tertiary transition-colors hover:bg-error/10 hover:text-error"
                    >
                      <DeleteOutlineOutlined fontSize="small" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 border-t border-border-tertiary pt-3">
                  {typesInCategory.map((type) => (
                    <span
                      key={type.id}
                      className="group inline-flex items-center gap-1 rounded-md bg-surface-secondary py-1 pl-2 pr-1 text-xs text-text-secondary"
                      title={type.description}
                    >
                      {type.name}
                      <button
                        type="button"
                        onClick={() => openEditTypeModal(type)}
                        aria-label={`${type.name} 수정`}
                        className="grid size-3.5 place-items-center rounded-full text-text-tertiary opacity-0 transition-opacity hover:text-text-primary group-hover:opacity-100"
                      >
                        <EditOutlined style={{ fontSize: 11 }} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingType(type)}
                        aria-label={`${type.name} 삭제`}
                        className="grid size-3.5 place-items-center rounded-full text-text-tertiary opacity-0 transition-opacity hover:text-error group-hover:opacity-100"
                      >
                        <CloseOutlined style={{ fontSize: 11 }} />
                      </button>
                    </span>
                  ))}

                  <button
                    type="button"
                    onClick={() => openAddTypeModal(category.id)}
                    className="inline-flex items-center gap-0.5 rounded-md border border-dashed border-border-secondary py-1 pl-1.5 pr-2 text-xs text-text-tertiary transition-colors hover:border-brand-500 hover:text-brand-500"
                  >
                    <AddOutlined style={{ fontSize: 13 }} />
                    문서 유형
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border-tertiary p-8 text-center text-sm text-text-tertiary">
          등록된 카테고리가 없어요.
        </p>
      )}

      {/* 카테고리 추가·수정 모달 */}
      <Modal
        open={isCategoryModalOpen}
        onClose={closeCategoryModal}
        title={editingCategory ? "카테고리 수정" : "카테고리 추가"}
      >
        <form onSubmit={handleCategorySubmit} noValidate className="flex flex-col gap-2">
          <Input
            label="항목"
            placeholder="인사/노무"
            value={categoryForm.name}
            onChange={(event) =>
              setCategoryForm((prev) => ({ ...prev, name: event.target.value }))
            }
            error={categoryErrors.name}
          />

          {categoryFormError && (
            <p role="alert" className="text-xs text-error">
              {categoryFormError}
            </p>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeCategoryModal}>
              취소
            </Button>
            <Button type="submit" disabled={isCategorySubmitting}>
              {isCategorySubmitting ? "저장 중…" : "저장"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={deletingCategory !== null}
        onClose={() => setDeletingCategory(null)}
        onConfirm={confirmDeleteCategory}
        title="카테고리 삭제"
        description={
          deletingCategory
            ? `'${deletingCategory.name}' 카테고리를 삭제할까요? 하위 문서 유형이나 이 카테고리를 조건으로 쓰는 규칙이 있으면 삭제할 수 없어요.`
            : ""
        }
        danger
        loading={isCategoryDeleting}
      />

      {/* 문서 유형 추가·수정 모달 */}
      <Modal
        open={isTypeModalOpen}
        onClose={closeTypeModal}
        title={editingType ? "문서 유형 수정" : "문서 유형 추가"}
      >
        <form onSubmit={handleTypeSubmit} noValidate className="flex flex-col gap-2">
          <div className="flex w-full flex-col gap-1.5">
            <label htmlFor="type-category" className="text-sm font-medium text-text-primary">
              카테고리
            </label>
            <select
              id="type-category"
              value={typeForm.categoryId}
              onChange={(event) => updateTypeField("categoryId", event.target.value)}
              className={SELECT_CLASS}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="항목"
            placeholder="급여명세서"
            value={typeForm.name}
            onChange={(event) => updateTypeField("name", event.target.value)}
            error={typeErrors.name}
          />

          <Input
            label="설명"
            placeholder="급여·공제 내역이 담긴 급여 명세 문서"
            value={typeForm.description}
            onChange={(event) => updateTypeField("description", event.target.value)}
            error={typeErrors.description}
            hint="설명이 구체적일수록 AI 분류가 정확해져요."
          />

          {typeFormError && (
            <p role="alert" className="text-xs text-error">
              {typeFormError}
            </p>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeTypeModal}>
              취소
            </Button>
            <Button type="submit" disabled={isTypeSubmitting}>
              {isTypeSubmitting ? "저장 중…" : "저장"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={deletingType !== null}
        onClose={() => setDeletingType(null)}
        onConfirm={confirmDeleteType}
        title="문서 유형 삭제"
        description={
          deletingType
            ? `'${deletingType.name}' 유형을 삭제할까요? 이 유형을 조건으로 쓰는 규칙이 있으면 삭제할 수 없어요.`
            : ""
        }
        danger
        loading={isTypeDeleting}
      />
    </div>
  );
}
