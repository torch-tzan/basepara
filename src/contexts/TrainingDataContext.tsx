import React, { createContext, useContext, useMemo, ReactNode } from "react";
import {
  useTrainingActions,
  useTrainingCourses,
  useTemplateCategories,
  useAddTrainingAction,
  useUpdateTrainingAction,
  useDeleteTrainingAction,
  useAddTrainingCourse,
  useUpdateTrainingCourse,
  useDeleteTrainingCourse,
  useAddTemplateCategory,
  useUpdateTemplateCategory,
  useDeleteTemplateCategory,
  useReorderTemplateCategories,
  type TrainingActionRow,
  type CourseWithActions,
  type TemplateCategoryRow,
} from "@/hooks/useSupabaseTraining";
import {
  usePersonalCourses,
  usePersonalTemplateCategories,
  useAddPersonalCourse,
  useUpdatePersonalCourse,
  useDeletePersonalCourse,
  useAddPersonalTemplateCategory,
  useUpdatePersonalTemplateCategory,
  useDeletePersonalTemplateCategory,
  useReorderPersonalTemplateCategories,
  type PersonalCourseWithActions,
  type PersonalTemplateCategoryRow,
} from "@/hooks/useSupabasePersonalCourses";
import type { ActionCategory } from "@/data/trainingTemplates";

// Re-export types from trainingTemplates for backward compatibility
export type { ActionCategory };

// 分類介面
export interface CategoryItem {
  id: string;
  name: string;
  order: number;
}

// 未分類常數
export const UNCATEGORIZED = "未分類";

// CourseItem interface for backward compatibility
export interface CourseItem {
  id: string;
  name: string;
  category: string;
  actionIds: string[];
  notes?: string;
  color?: string;
  updatedAt: string;
  type: "public";
}

// Course action data for saving
export interface CourseActionData {
  actionId: string;
  sortOrder: number;
  sets: number;
  reps: number;
  intensity: number;
}

// Personal course item interface
export interface PersonalCourseItem {
  id: string;
  name: string;
  category: string;
  actionIds: string[];
  notes?: string;
  color?: string;
  updatedAt: string;
  type: "personal";
}

// ActionItem interface for backward compatibility
export interface ActionItem {
  id: string;
  name: string;
  category: string;
  actionCategory: ActionCategory;
  bat?: string;
  scenario?: string;
  ball?: string;
  equipment?: string;
  sets: number;
  reps: number;
  intensity: number;
  notes?: string;
  videoUrl?: string;
  updatedAt: string;
  type: "action";
}

export type TemplateItem = CourseItem | ActionItem | PersonalCourseItem;

// Convert database action to frontend format
const convertAction = (action: TrainingActionRow): ActionItem => ({
  id: action.id,
  name: action.name,
  category: action.category,
  actionCategory: action.action_category as ActionCategory,
  bat: action.bat || undefined,
  scenario: action.scenario || undefined,
  ball: action.ball || undefined,
  equipment: action.equipment || undefined,
  sets: action.sets ?? 3,
  reps: action.reps ?? 10,
  intensity: action.intensity ?? 70,
  notes: action.notes || undefined,
  videoUrl: action.video_url || undefined,
  updatedAt: new Date(action.updated_at).toISOString().split("T")[0],
  type: "action",
});

// Convert database course to frontend format
const convertCourse = (course: CourseWithActions): CourseItem => ({
  id: course.id,
  name: course.name,
  category: course.category,
  actionIds: course.actionIds,
  notes: course.notes || undefined,
  color: course.color || undefined,
  updatedAt: new Date(course.updated_at).toISOString().split("T")[0],
  type: "public",
});

// Convert personal course to frontend format
const convertPersonalCourse = (course: PersonalCourseWithActions): PersonalCourseItem => ({
  id: course.id,
  name: course.name,
  category: course.category,
  actionIds: course.actionIds,
  notes: course.notes || undefined,
  color: course.color || undefined,
  updatedAt: new Date(course.updated_at).toISOString().split("T")[0],
  type: "personal",
});

// Convert database category to frontend format
const convertCategory = (category: TemplateCategoryRow): CategoryItem => ({
  id: category.id,
  name: category.name,
  order: category.sort_order ?? 0,
});

// Convert personal template category to frontend format
const convertPersonalCategory = (category: PersonalTemplateCategoryRow): CategoryItem => ({
  id: category.id,
  name: category.name,
  order: category.sort_order ?? 0,
});

interface TrainingDataContextType {
  // Data
  courses: CourseItem[];
  actions: ActionItem[];
  templates: TemplateItem[];
  courseCategories: CategoryItem[];
  actionCategories: CategoryItem[];
  isLoading: boolean;
  
  // Personal courses data
  personalCourses: PersonalCourseItem[];
  personalCourseCategories: CategoryItem[];
  isLoadingPersonal: boolean;
  
  // Course CRUD
  addCourse: (course: Omit<CourseItem, "id" | "updatedAt" | "type"> & { courseActions?: CourseActionData[] }) => Promise<CourseItem>;
  updateCourse: (id: string, course: Partial<Omit<CourseItem, "id" | "type">> & { courseActions?: CourseActionData[] }) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  getCourseById: (id: string) => CourseItem | undefined;
  
  // Action CRUD
  addAction: (action: Omit<ActionItem, "id" | "updatedAt" | "type">) => Promise<ActionItem>;
  updateAction: (id: string, action: Partial<Omit<ActionItem, "id" | "type">>) => Promise<void>;
  deleteAction: (id: string) => Promise<void>;
  getActionById: (id: string) => ActionItem | undefined;
  getActionsByIds: (ids: string[]) => ActionItem[];
  
  // Category CRUD
  addCourseCategory: (name: string) => Promise<CategoryItem>;
  updateCourseCategory: (id: string, name: string) => Promise<void>;
  deleteCourseCategory: (id: string) => Promise<void>;
  getCoursesCategoryUsage: (categoryName: string) => CourseItem[];
  reorderCourseCategories: (orderedIds: string[]) => Promise<void>;
  
  addActionCategory: (name: string) => Promise<CategoryItem>;
  updateActionCategory: (id: string, name: string) => Promise<void>;
  deleteActionCategory: (id: string) => Promise<void>;
  getActionsCategoryUsage: (categoryName: string) => ActionItem[];
  reorderActionCategories: (orderedIds: string[]) => Promise<void>;
  
  // Personal course CRUD
  addPersonalCourse: (course: Omit<PersonalCourseItem, "id" | "updatedAt" | "type"> & { courseActions?: CourseActionData[] }) => Promise<PersonalCourseItem>;
  updatePersonalCourse: (id: string, course: Partial<Omit<PersonalCourseItem, "id" | "type">> & { courseActions?: CourseActionData[] }) => Promise<void>;
  deletePersonalCourse: (id: string) => Promise<void>;
  getPersonalCourseById: (id: string) => PersonalCourseItem | undefined;
  
  // Personal category CRUD
  addPersonalCourseCategory: (name: string) => Promise<CategoryItem>;
  updatePersonalCourseCategory: (id: string, name: string) => Promise<void>;
  deletePersonalCourseCategory: (id: string) => Promise<void>;
  getPersonalCoursesCategoryUsage: (categoryName: string) => PersonalCourseItem[];
  reorderPersonalCourseCategories: (orderedIds: string[]) => Promise<void>;
  
  // Utility
  getActionUsageInCourses: (actionId: string) => CourseItem[];
}

const TrainingDataContext = createContext<TrainingDataContextType | undefined>(undefined);

// Generate unique ID
const generateId = (prefix: string, existingIds: string[]): string => {
  let counter = existingIds.length + 1;
  let newId = `${prefix}${counter}`;
  while (existingIds.includes(newId)) {
    counter++;
    newId = `${prefix}${counter}`;
  }
  return newId;
};

export const TrainingDataProvider = ({ children }: { children: ReactNode }) => {
  // Fetch data from Supabase
  const { data: actionsData, isLoading: actionsLoading } = useTrainingActions();
  const { data: coursesData, isLoading: coursesLoading } = useTrainingCourses();
  const { data: courseCategoriesData, isLoading: courseCatsLoading } = useTemplateCategories("course");
  const { data: actionCategoriesData, isLoading: actionCatsLoading } = useTemplateCategories("action");
  
  // Personal courses data
  const { data: personalCoursesData, isLoading: personalCoursesLoading } = usePersonalCourses();
  const { data: personalCategoriesData, isLoading: personalCatsLoading } = usePersonalTemplateCategories();
  
  // Mutations
  const addActionMutation = useAddTrainingAction();
  const updateActionMutation = useUpdateTrainingAction();
  const deleteActionMutation = useDeleteTrainingAction();
  const addCourseMutation = useAddTrainingCourse();
  const updateCourseMutation = useUpdateTrainingCourse();
  const deleteCourseMutation = useDeleteTrainingCourse();
  const addCategoryMutation = useAddTemplateCategory();
  const updateCategoryMutation = useUpdateTemplateCategory();
  const deleteCategoryMutation = useDeleteTemplateCategory();
  const reorderCategoriesMutation = useReorderTemplateCategories();
  
  // Personal course mutations
  const addPersonalCourseMutation = useAddPersonalCourse();
  const updatePersonalCourseMutation = useUpdatePersonalCourse();
  const deletePersonalCourseMutation = useDeletePersonalCourse();
  const addPersonalCategoryMutation = useAddPersonalTemplateCategory();
  const updatePersonalCategoryMutation = useUpdatePersonalTemplateCategory();
  const deletePersonalCategoryMutation = useDeletePersonalTemplateCategory();
  const reorderPersonalCategoriesMutation = useReorderPersonalTemplateCategories();
  
  const isLoading = actionsLoading || coursesLoading || courseCatsLoading || actionCatsLoading;
  const isLoadingPersonal = personalCoursesLoading || personalCatsLoading;
  
  // Convert data to frontend format
  const actions = useMemo(() => 
    (actionsData || []).map(convertAction), 
    [actionsData]
  );
  
  const courses = useMemo(() => 
    (coursesData || []).map(convertCourse), 
    [coursesData]
  );
  
  const personalCourses = useMemo(() => 
    (personalCoursesData || []).map(convertPersonalCourse), 
    [personalCoursesData]
  );
  
  const templates: TemplateItem[] = useMemo(() => 
    [...courses, ...actions, ...personalCourses], 
    [courses, actions, personalCourses]
  );
  
  const courseCategories = useMemo(() => 
    (courseCategoriesData || []).map(convertCategory).sort((a, b) => a.order - b.order), 
    [courseCategoriesData]
  );
  
  const actionCategories = useMemo(() => 
    (actionCategoriesData || []).map(convertCategory).sort((a, b) => a.order - b.order), 
    [actionCategoriesData]
  );
  
  const personalCourseCategories = useMemo(() => 
    (personalCategoriesData || []).map(convertPersonalCategory).sort((a, b) => a.order - b.order), 
    [personalCategoriesData]
  );

  // ============= Course Methods =============
  const getCourseById = (id: string) => courses.find((c) => c.id === id);

  const addCourse = async (courseData: Omit<CourseItem, "id" | "updatedAt" | "type"> & { courseActions?: CourseActionData[] }): Promise<CourseItem> => {
    const newId = generateId("c", courses.map((c) => c.id));
    await addCourseMutation.mutateAsync({
      id: newId,
      name: courseData.name,
      category: courseData.category,
      notes: courseData.notes,
      color: courseData.color,
      actionIds: courseData.actionIds,
      courseActions: courseData.courseActions,
    });
    return {
      ...courseData,
      id: newId,
      updatedAt: new Date().toISOString().split("T")[0],
      type: "public",
    };
  };

  const updateCourse = async (id: string, courseData: Partial<Omit<CourseItem, "id" | "type">> & { courseActions?: CourseActionData[] }) => {
    await updateCourseMutation.mutateAsync({
      id,
      name: courseData.name,
      category: courseData.category,
      notes: courseData.notes,
      color: courseData.color,
      actionIds: courseData.actionIds,
      courseActions: courseData.courseActions,
    });
  };

  const deleteCourse = async (id: string) => {
    await deleteCourseMutation.mutateAsync(id);
  };

  // ============= Action Methods =============
  const getActionById = (id: string) => actions.find((a) => a.id === id);

  const getActionsByIds = (ids: string[]) => 
    ids.map((id) => actions.find((a) => a.id === id)).filter((a): a is ActionItem => a !== undefined);

  const addAction = async (actionData: Omit<ActionItem, "id" | "updatedAt" | "type">): Promise<ActionItem> => {
    const newId = generateId("a", actions.map((a) => a.id));
    await addActionMutation.mutateAsync({
      id: newId,
      name: actionData.name,
      category: actionData.category,
      action_category: actionData.actionCategory,
      bat: actionData.bat,
      scenario: actionData.scenario,
      ball: actionData.ball,
      equipment: actionData.equipment,
      sets: actionData.sets,
      reps: actionData.reps,
      intensity: actionData.intensity,
      notes: actionData.notes,
      video_url: actionData.videoUrl,
    });
    return {
      ...actionData,
      id: newId,
      updatedAt: new Date().toISOString().split("T")[0],
      type: "action",
    };
  };

  const updateAction = async (id: string, actionData: Partial<Omit<ActionItem, "id" | "type">>) => {
    await updateActionMutation.mutateAsync({
      id,
      name: actionData.name,
      category: actionData.category,
      action_category: actionData.actionCategory,
      bat: actionData.bat,
      scenario: actionData.scenario,
      ball: actionData.ball,
      equipment: actionData.equipment,
      sets: actionData.sets,
      reps: actionData.reps,
      intensity: actionData.intensity,
      notes: actionData.notes,
      video_url: actionData.videoUrl,
    });
  };

  const deleteAction = async (id: string) => {
    await deleteActionMutation.mutateAsync(id);
  };

  const getActionUsageInCourses = (actionId: string) => 
    courses.filter((c) => c.actionIds.includes(actionId));

  // ============= Category Methods =============
  const addCourseCategory = async (name: string): Promise<CategoryItem> => {
    const maxOrder = Math.max(...courseCategories.map((c) => c.order), -1) + 1;
    const result = await addCategoryMutation.mutateAsync({
      name,
      type: "course",
      sort_order: maxOrder,
    });
    return { id: result.id, name: result.name, order: result.sort_order ?? maxOrder };
  };

  const updateCourseCategory = async (id: string, name: string) => {
    const oldCategory = courseCategories.find((c) => c.id === id);
    if (!oldCategory) return;
    
    await updateCategoryMutation.mutateAsync({ id, name });
    
    // Update courses using this category
    const coursesToUpdate = courses.filter((c) => c.category === oldCategory.name);
    for (const course of coursesToUpdate) {
      await updateCourseMutation.mutateAsync({ id: course.id, category: name });
    }
  };

  const deleteCourseCategory = async (id: string) => {
    const categoryToDelete = courseCategories.find((c) => c.id === id);
    if (!categoryToDelete) return;
    
    // Move courses to UNCATEGORIZED
    const coursesToUpdate = courses.filter((c) => c.category === categoryToDelete.name);
    for (const course of coursesToUpdate) {
      await updateCourseMutation.mutateAsync({ id: course.id, category: UNCATEGORIZED });
    }
    
    await deleteCategoryMutation.mutateAsync(id);
  };

  const getCoursesCategoryUsage = (categoryName: string) => 
    courses.filter((c) => c.category === categoryName);

  const reorderCourseCategories = async (orderedIds: string[]) => {
    const orderedCategories = orderedIds.map((id, index) => ({ id, sort_order: index }));
    await reorderCategoriesMutation.mutateAsync(orderedCategories);
  };

  const addActionCategory = async (name: string): Promise<CategoryItem> => {
    const maxOrder = Math.max(...actionCategories.map((c) => c.order), -1) + 1;
    const result = await addCategoryMutation.mutateAsync({
      name,
      type: "action",
      sort_order: maxOrder,
    });
    return { id: result.id, name: result.name, order: result.sort_order ?? maxOrder };
  };

  const updateActionCategory = async (id: string, name: string) => {
    const oldCategory = actionCategories.find((c) => c.id === id);
    if (!oldCategory) return;
    
    await updateCategoryMutation.mutateAsync({ id, name });
    
    // Update actions using this category
    const actionsToUpdate = actions.filter((a) => a.category === oldCategory.name);
    for (const action of actionsToUpdate) {
      await updateActionMutation.mutateAsync({ id: action.id, category: name });
    }
  };

  const deleteActionCategory = async (id: string) => {
    const categoryToDelete = actionCategories.find((c) => c.id === id);
    if (!categoryToDelete) return;
    
    // Move actions to UNCATEGORIZED
    const actionsToUpdate = actions.filter((a) => a.category === categoryToDelete.name);
    for (const action of actionsToUpdate) {
      await updateActionMutation.mutateAsync({ id: action.id, category: UNCATEGORIZED });
    }
    
    await deleteCategoryMutation.mutateAsync(id);
  };

  const getActionsCategoryUsage = (categoryName: string) => 
    actions.filter((a) => a.category === categoryName);

  const reorderActionCategories = async (orderedIds: string[]) => {
    const orderedCategories = orderedIds.map((id, index) => ({ id, sort_order: index }));
    await reorderCategoriesMutation.mutateAsync(orderedCategories);
  };

  // ============= Personal Course Methods =============
  const getPersonalCourseById = (id: string) => personalCourses.find((c) => c.id === id);

  const addPersonalCourse = async (courseData: Omit<PersonalCourseItem, "id" | "updatedAt" | "type"> & { courseActions?: CourseActionData[] }): Promise<PersonalCourseItem> => {
    const newId = generateId("pc", personalCourses.map((c) => c.id));
    await addPersonalCourseMutation.mutateAsync({
      id: newId,
      name: courseData.name,
      category: courseData.category,
      notes: courseData.notes,
      color: courseData.color,
      actionIds: courseData.actionIds,
      courseActions: courseData.courseActions,
    });
    return {
      ...courseData,
      id: newId,
      updatedAt: new Date().toISOString().split("T")[0],
      type: "personal",
    };
  };

  const updatePersonalCourse = async (id: string, courseData: Partial<Omit<PersonalCourseItem, "id" | "type">> & { courseActions?: CourseActionData[] }) => {
    await updatePersonalCourseMutation.mutateAsync({
      id,
      name: courseData.name,
      category: courseData.category,
      notes: courseData.notes,
      color: courseData.color,
      actionIds: courseData.actionIds,
      courseActions: courseData.courseActions,
    });
  };

  const deletePersonalCourse = async (id: string) => {
    await deletePersonalCourseMutation.mutateAsync(id);
  };

  // ============= Personal Category Methods =============
  const addPersonalCourseCategory = async (name: string): Promise<CategoryItem> => {
    const maxOrder = Math.max(...personalCourseCategories.map((c) => c.order), -1) + 1;
    const result = await addPersonalCategoryMutation.mutateAsync({
      name,
      sort_order: maxOrder,
    });
    return { id: result.id, name: result.name, order: result.sort_order ?? maxOrder };
  };

  const updatePersonalCourseCategory = async (id: string, name: string) => {
    const oldCategory = personalCourseCategories.find((c) => c.id === id);
    if (!oldCategory) return;
    
    await updatePersonalCategoryMutation.mutateAsync({ id, name });
    
    // Update personal courses using this category
    const coursesToUpdate = personalCourses.filter((c) => c.category === oldCategory.name);
    for (const course of coursesToUpdate) {
      await updatePersonalCourseMutation.mutateAsync({ id: course.id, category: name });
    }
  };

  const deletePersonalCourseCategory = async (id: string) => {
    const categoryToDelete = personalCourseCategories.find((c) => c.id === id);
    if (!categoryToDelete) return;
    
    // Move personal courses to UNCATEGORIZED
    const coursesToUpdate = personalCourses.filter((c) => c.category === categoryToDelete.name);
    for (const course of coursesToUpdate) {
      await updatePersonalCourseMutation.mutateAsync({ id: course.id, category: UNCATEGORIZED });
    }
    
    await deletePersonalCategoryMutation.mutateAsync(id);
  };

  const getPersonalCoursesCategoryUsage = (categoryName: string) => 
    personalCourses.filter((c) => c.category === categoryName);

  const reorderPersonalCourseCategories = async (orderedIds: string[]) => {
    const orderedCategories = orderedIds.map((id, index) => ({ id, sort_order: index }));
    await reorderPersonalCategoriesMutation.mutateAsync(orderedCategories);
  };

  const value: TrainingDataContextType = useMemo(() => ({
    courses,
    actions,
    templates,
    courseCategories,
    actionCategories,
    isLoading,
    personalCourses,
    personalCourseCategories,
    isLoadingPersonal,
    addCourse,
    updateCourse,
    deleteCourse,
    getCourseById,
    addAction,
    updateAction,
    deleteAction,
    getActionById,
    getActionsByIds,
    addCourseCategory,
    updateCourseCategory,
    deleteCourseCategory,
    getCoursesCategoryUsage,
    reorderCourseCategories,
    addActionCategory,
    updateActionCategory,
    deleteActionCategory,
    getActionsCategoryUsage,
    reorderActionCategories,
    addPersonalCourse,
    updatePersonalCourse,
    deletePersonalCourse,
    getPersonalCourseById,
    addPersonalCourseCategory,
    updatePersonalCourseCategory,
    deletePersonalCourseCategory,
    getPersonalCoursesCategoryUsage,
    reorderPersonalCourseCategories,
    getActionUsageInCourses,
  }), [courses, actions, templates, courseCategories, actionCategories, isLoading, personalCourses, personalCourseCategories, isLoadingPersonal]);

  return (
    <TrainingDataContext.Provider value={value}>
      {children}
    </TrainingDataContext.Provider>
  );
};

export const useTrainingData = (): TrainingDataContextType => {
  const context = useContext(TrainingDataContext);
  if (context === undefined) {
    throw new Error("useTrainingData must be used within a TrainingDataProvider");
  }
  return context;
};
