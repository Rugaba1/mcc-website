
export const PERMISSIONS = {
  // User Management
  USER_READ: { name: "user:read", label: "", description: " Lorem ipsum dolor sit amet consectetur, adipisicing elit. Rerum sit accusamus, natus eveniet eaque architecto debitis facilis repudiandae necessitatibus optio sapiente iusto sunt quae, error aspernatur harum excepturi expedita impedit." },
  USER_CREATE: { name: "user:create", label: "", description: " Lorem ipsum dolor sit amet consectetur, adipisicing elit. Rerum sit accusamus, natus eveniet eaque architecto debitis facilis repudiandae necessitatibus optio sapiente iusto sunt quae, error aspernatur harum excepturi expedita impedit." },
  USER_UPDATE: { name: "user:update", label: "", description: " Lorem ipsum dolor sit amet consectetur, adipisicing elit. Rerum sit accusamus, natus eveniet eaque architecto debitis facilis repudiandae necessitatibus optio sapiente iusto sunt quae, error aspernatur harum excepturi expedita impedit." },
  USER_DELETE: { name: "user:delete", label: "", description: " Lorem ipsum dolor sit amet consectetur, adipisicing elit. Rerum sit accusamus, natus eveniet eaque architecto debitis facilis repudiandae necessitatibus optio sapiente iusto sunt quae, error aspernatur harum excepturi expedita impedit." },

  // PDF Management
  PDF_READ: { name: "pdf:read", label: "", description: " Lorem ipsum dolor sit amet consectetur, adipisicing elit. Rerum sit accusamus, natus eveniet eaque architecto debitis facilis repudiandae necessitatibus optio sapiente iusto sunt quae, error aspernatur harum excepturi expedita impedit." },
  PDF_UPLOAD: { name: "pdf:upload", label: "", description: " Lorem ipsum dolor sit amet consectetur, adipisicing elit. Rerum sit accusamus, natus eveniet eaque architecto debitis facilis repudiandae necessitatibus optio sapiente iusto sunt quae, error aspernatur harum excepturi expedita impedit." },
  PDF_UPDATE: { name: "pdf:update", label: "", description: " Lorem ipsum dolor sit amet consectetur, adipisicing elit. Rerum sit accusamus, natus eveniet eaque architecto debitis facilis repudiandae necessitatibus optio sapiente iusto sunt quae, error aspernatur harum excepturi expedita impedit." },
  PDF_DELETE:  { name: "pdf:delete", label: "", description: " Lorem ipsum dolor sit amet consectetur, adipisicing elit. Rerum sit accusamus, natus eveniet eaque architecto debitis facilis repudiandae necessitatibus optio sapiente iusto sunt quae, error aspernatur harum excepturi expedita impedit." }, 
} as const;
PERMISSIONS

 
export function hasPermission(userPermissions: string[], required: string | string[]): boolean {
  const requiredPerms = Array.isArray(required) ? required : [required];
  return requiredPerms.every(perm => userPermissions.includes(perm));
}