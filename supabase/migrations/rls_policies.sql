-- Enable Row-Level Security on all public tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plot_crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plot_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fertilizer_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diesel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machinery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labor_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.general_purchase_logs ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------------------------------
-- Helper Functions
--------------------------------------------------------------------------------

-- Checks if the user is a Super Admin (has canManageUsers permission)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.can_manage_users = TRUE
  );
END;
$$ LANGUAGE plpgsql;

-- Checks if the user has a specific permission flag
CREATE OR REPLACE FUNCTION public.has_permission(permission_column TEXT)
RETURNS BOOLEAN SECURITY DEFINER AS $$
DECLARE
  has_perm BOOLEAN;
BEGIN
  EXECUTE format('
    SELECT r.%I FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = $1', permission_column)
  INTO has_perm
  USING auth.uid();
  
  RETURN COALESCE(has_perm, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Checks if a user is assigned to a specific Plot
CREATE OR REPLACE FUNCTION public.is_assigned_to_plot(plot_id UUID)
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN TRUE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.plot_assignments
    WHERE user_id = auth.uid() AND plot_assignments.plot_id = $1
  );
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- RLS Policies
--------------------------------------------------------------------------------

-- Roles & UserRoles
CREATE POLICY "Admins manage roles" ON public.roles
  FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Read roles" ON public.roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage user_roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Read user_roles" ON public.user_roles
  FOR SELECT TO authenticated USING (true);

-- Plots
CREATE POLICY "Plots access policy" ON public.plots
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR (
      public.has_permission('canManagePlots') AND 
      EXISTS (
        SELECT 1 FROM public.plot_assignments 
        WHERE user_id = auth.uid() AND plot_id = id
      )
    )
  );

-- Plot Assignments (Admin Only)
CREATE POLICY "Admins manage plot assignments" ON public.plot_assignments
  FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Read own plot assignments" ON public.plot_assignments
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Crop Activities
CREATE POLICY "Crops view policy" ON public.crop_activities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Crops manage policy" ON public.crop_activities
  FOR ALL TO authenticated USING (public.is_admin() OR public.has_permission('canManageCrops'));

-- PlotCrops (Association)
CREATE POLICY "PlotCrops access policy" ON public.plot_crops
  FOR SELECT TO authenticated
  USING (
    public.is_admin() OR 
    public.is_assigned_to_plot(plot_id)
  );

CREATE POLICY "PlotCrops manage policy" ON public.plot_crops
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR (
      public.has_permission('canManageCrops') AND 
      public.is_assigned_to_plot(plot_id)
    )
  );

-- Fertilizer Logs
CREATE POLICY "Fertilizer logs access" ON public.fertilizer_logs
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR (
      public.has_permission('canLogFertilizer') AND (
        plot_crop_id IS NULL OR EXISTS (
          SELECT 1 FROM public.plot_crops pc
          WHERE pc.id = plot_crop_id AND public.is_assigned_to_plot(pc.plot_id)
        )
      )
    )
  );

-- Diesel Logs
CREATE POLICY "Diesel logs access" ON public.diesel_logs
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR public.has_permission('canLogDiesel')
  );

-- Machinery Logs
CREATE POLICY "Machinery logs access" ON public.machinery_logs
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR (
      public.has_permission('canLogMachinery') AND EXISTS (
        SELECT 1 FROM public.plot_crops pc
        WHERE pc.id = plot_crop_id AND public.is_assigned_to_plot(pc.plot_id)
      )
    )
  );

-- Labor Logs
CREATE POLICY "Labor logs access" ON public.labor_logs
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR (
      public.has_permission('canLogLabor') AND EXISTS (
        SELECT 1 FROM public.plot_crops pc
        WHERE pc.id = plot_crop_id AND public.is_assigned_to_plot(pc.plot_id)
      )
    )
  );

-- Production Logs
CREATE POLICY "Production logs access" ON public.production_logs
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR (
      public.has_permission('canLogProduction') AND EXISTS (
        SELECT 1 FROM public.plot_crops pc
        WHERE pc.id = plot_crop_id AND public.is_assigned_to_plot(pc.plot_id)
      )
    )
  );

-- Sales Logs
CREATE POLICY "Sales logs access" ON public.sales_logs
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR (
      public.has_permission('canLogSales') AND EXISTS (
        SELECT 1 FROM public.plot_crops pc
        WHERE pc.id = plot_crop_id AND public.is_assigned_to_plot(pc.plot_id)
      )
    )
  );

-- General Purchase Logs
CREATE POLICY "General purchase logs access" ON public.general_purchase_logs
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR (
      public.has_permission('canLogFertilizer') OR 
      public.has_permission('canLogDiesel') OR 
      public.has_permission('canLogMachinery') OR 
      public.has_permission('canLogLabor')
    ) AND (
      plot_crop_id IS NULL OR EXISTS (
        SELECT 1 FROM public.plot_crops pc
        WHERE pc.id = plot_crop_id AND public.is_assigned_to_plot(pc.plot_id)
      )
    )
  );
