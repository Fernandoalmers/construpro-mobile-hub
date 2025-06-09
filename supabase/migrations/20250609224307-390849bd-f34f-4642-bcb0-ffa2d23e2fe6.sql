
-- Criar policy para admins verem todos os ajustes de pontos
CREATE POLICY "Admins can view all point adjustments"
ON pontos_ajustados
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.is_admin = true
  )
);

-- Adicionar foreign key para integridade referencial
ALTER TABLE pontos_ajustados
ADD CONSTRAINT fk_pontos_ajustados_vendedor
FOREIGN KEY (vendedor_id) REFERENCES vendedores(id);
