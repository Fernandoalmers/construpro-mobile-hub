
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Initialize Supabase client using Deno env vars
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    // Verify the user's token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: authError?.message || "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    // GET requests - fetch data
    if (req.method === "GET") {
      // Get all service requests (with filters)
      if (path === "requests") {
        const { status, category, limit, offset } = Object.fromEntries(url.searchParams);
        
        let query = supabase
          .from("service_requests")
          .select(`
            *,
            proposals (*)
          `);
        
        if (status) {
          query = query.eq("status", status);
        }
        
        if (category) {
          query = query.eq("categoria", category);
        }
        
        const { data, error } = await query
          .order("data_criacao", { ascending: false })
          .range(Number(offset) || 0, (Number(offset) || 0) + (Number(limit) || 9));
        
        if (error) throw error;
        
        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
      
      // Get a single service request by ID
      if (path === "request") {
        const id = url.searchParams.get("id");
        if (!id) {
          return new Response(
            JSON.stringify({ error: "Missing request ID" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }
        
        const { data, error } = await supabase
          .from("service_requests")
          .select(`
            *,
            proposals (*)
          `)
          .eq("id", id)
          .single();
        
        if (error) throw error;
        
        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
      
      // Get all proposals for a professional
      if (path === "my-proposals") {
        const { data: professionalData } = await supabase
          .from("professionals")
          .select("id")
          .eq("profile_id", user.id)
          .single();
          
        if (!professionalData) {
          return new Response(
            JSON.stringify({ error: "Professional profile not found" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
          );
        }
          
        const professionalId = professionalData.id;
        
        const { data, error } = await supabase
          .from("proposals")
          .select(`
            *,
            service_requests (*)
          `)
          .eq("profissional_id", professionalId)
          .order("data_criacao", { ascending: false });
        
        if (error) throw error;
        
        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
      
      // Get all projects
      if (path === "projects") {
        const isProfessional = url.searchParams.get("isProfessional") === "true";
        
        let userId = user.id;
        
        // If professional, get professional ID first
        if (isProfessional) {
          const { data: professionalData } = await supabase
            .from("professionals")
            .select("id")
            .eq("profile_id", user.id)
            .single();
            
          if (!professionalData) {
            return new Response(
              JSON.stringify({ error: "Professional profile not found" }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
            );
          }
            
          userId = professionalData.id;
        }
        
        let query = supabase
          .from("projects")
          .select(`
            *,
            project_steps (*),
            project_images (*)
          `);
        
        // Filter based on user type
        if (isProfessional) {
          query = query.eq("profissional_id", userId);
        } else {
          query = query.eq("cliente_id", userId);
        }
        
        const { data, error } = await query.order("data_inicio", { ascending: false });
        
        if (error) throw error;
        
        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
      
      // Get a single project by ID
      if (path === "project") {
        const id = url.searchParams.get("id");
        if (!id) {
          return new Response(
            JSON.stringify({ error: "Missing project ID" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }
        
        const { data, error } = await supabase
          .from("projects")
          .select(`
            *,
            project_steps (*),
            project_images (*)
          `)
          .eq("id", id)
          .single();
        
        if (error) throw error;
        
        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
      
      // Get professional profile
      if (path === "professional-profile") {
        const professionalId = url.searchParams.get("id");
        const currentUserId = user.id;
        
        let query = supabase.from("professionals").select("*");
        
        if (professionalId) {
          query = query.eq("id", professionalId);
        } else {
          query = query.eq("profile_id", currentUserId);
        }
        
        const { data, error } = await query.single();
        
        if (error) {
          // If no profile found, return empty but not error
          if (error.code === "PGRST116") {
            return new Response(
              JSON.stringify({ data: null }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
            );
          }
          throw error;
        }
        
        // Get reviews
        const { data: reviews } = await supabase
          .from("professional_reviews")
          .select("*")
          .eq("profissional_id", data.id)
          .order("data", { ascending: false });
        
        return new Response(
          JSON.stringify({ 
            data: {
              ...data,
              reviews: reviews || []
            }
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }
    
    // POST requests - create data
    if (req.method === "POST") {
      const body = await req.json();
      
      // Create a service request
      if (path === "create-request") {
        const {
          titulo,
          descricao,
          categoria,
          endereco,
          localizacao,
          data,
          horario,
          orcamento,
          requisitos,
          detalhesCliente,
          informacoesAdicionais
        } = body;
        
        // Get user information for cliente_id, nome_cliente, contato_cliente
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("nome, telefone")
          .eq("id", user.id)
          .single();
          
        if (profileError) throw profileError;
        
        const { data: newRequest, error } = await supabase
          .from("service_requests")
          .insert({
            cliente_id: user.id,
            titulo,
            descricao,
            categoria,
            endereco,
            localizacao,
            data,
            horario,
            orcamento,
            requisitos,
            detalhes_cliente: detalhesCliente,
            informacoes_adicionais: informacoesAdicionais,
            nome_cliente: profileData.nome || "Cliente",
            contato_cliente: profileData.telefone || "",
            status: "aberto"
          })
          .select()
          .single();
        
        if (error) throw error;
        
        return new Response(
          JSON.stringify({ data: newRequest }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 201 }
        );
      }
      
      // Create a proposal
      if (path === "submit-proposal") {
        const {
          serviceRequestId,
          valor,
          prazo,
          mensagem
        } = body;
        
        // Get professional ID
        const { data: professionalData, error: professionalError } = await supabase
          .from("professionals")
          .select("id, nome, foto_perfil, especialidade")
          .eq("profile_id", user.id)
          .single();
          
        if (professionalError) {
          return new Response(
            JSON.stringify({ error: "Professional profile not found. Please complete your profile first." }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
          );
        }
        
        const { data: newProposal, error } = await supabase
          .from("proposals")
          .insert({
            service_request_id: serviceRequestId,
            profissional_id: professionalData.id,
            nome_profissional: professionalData.nome,
            foto_profissional: professionalData.foto_perfil,
            especialidade_profissional: professionalData.especialidade,
            valor,
            prazo,
            mensagem,
            status: "enviada"
          })
          .select()
          .single();
        
        if (error) throw error;
        
        // Update service request status if it was open
        await supabase
          .from("service_requests")
          .update({ status: "em_negociacao" })
          .eq("id", serviceRequestId)
          .eq("status", "aberto");
        
        return new Response(
          JSON.stringify({ data: newProposal }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 201 }
        );
      }
      
      // Create or update professional profile
      if (path === "professional-profile") {
        const {
          nome,
          foto_perfil,
          especialidade,
          especialidades,
          telefone,
          cidade,
          estado,
          sobre,
          areaAtuacao,
          portfolio
        } = body;
        
        // Check if professional profile exists
        const { data: existingProfile } = await supabase
          .from("professionals")
          .select("id")
          .eq("profile_id", user.id)
          .maybeSingle();
        
        let result;
        
        if (existingProfile) {
          // Update existing profile
          result = await supabase
            .from("professionals")
            .update({
              nome,
              foto_perfil,
              especialidade,
              especialidades,
              telefone,
              cidade,
              estado,
              sobre,
              area_atuacao: areaAtuacao,
              portfolio
            })
            .eq("id", existingProfile.id)
            .select()
            .single();
        } else {
          // Create new profile
          result = await supabase
            .from("professionals")
            .insert({
              profile_id: user.id,
              nome,
              foto_perfil,
              especialidade,
              especialidades,
              telefone,
              cidade,
              estado,
              sobre,
              area_atuacao: areaAtuacao,
              portfolio,
              servicos_realizados: 0,
              avaliacao: 0
            })
            .select()
            .single();
            
          // Also update the user's papel in profiles
          await supabase
            .from("profiles")
            .update({ papel: "profissional" })
            .eq("id", user.id);
        }
        
        if (result.error) throw result.error;
        
        return new Response(
          JSON.stringify({ data: result.data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
      
      // Submit a review
      if (path === "submit-review") {
        const {
          projectId,
          professionalId,
          nota,
          comentario,
          servicoRealizado
        } = body;
        
        // Get user name for the review
        const { data: profile } = await supabase
          .from("profiles")
          .select("nome")
          .eq("id", user.id)
          .single();
        
        const { data: newReview, error } = await supabase
          .from("professional_reviews")
          .insert({
            projeto_id: projectId,
            profissional_id: professionalId,
            cliente_id: user.id,
            nome_cliente: profile.nome,
            nota,
            comentario,
            servico_realizado: servicoRealizado,
            data: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) throw error;
        
        // Update project's avaliado status
        await supabase
          .from("projects")
          .update({ avaliado: true })
          .eq("id", projectId);
          
        // Update professional's average rating
        const { data: reviews } = await supabase
          .from("professional_reviews")
          .select("nota")
          .eq("profissional_id", professionalId);
          
        if (reviews && reviews.length > 0) {
          const avgRating = reviews.reduce((sum, review) => sum + review.nota, 0) / reviews.length;
          await supabase
            .from("professionals")
            .update({ avaliacao: avgRating })
            .eq("id", professionalId);
        }
        
        return new Response(
          JSON.stringify({ data: newReview }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 201 }
        );
      }
    }
    
    // PUT requests - update data
    if (req.method === "PUT") {
      const body = await req.json();
      
      // Accept/reject a proposal
      if (path === "update-proposal") {
        const { proposalId, serviceRequestId, status, action } = body;
        
        // Update the proposal status
        const { data: updatedProposal, error } = await supabase
          .from("proposals")
          .update({ status })
          .eq("id", proposalId)
          .select()
          .single();
        
        if (error) throw error;
        
        // If accepting a proposal, create a project and update other proposals
        if (action === "accept") {
          // Get the service request details
          const { data: serviceRequest } = await supabase
            .from("service_requests")
            .select("*")
            .eq("id", serviceRequestId)
            .single();
            
          // Get the accepted proposal details
          const { data: proposal } = await supabase
            .from("proposals")
            .select("*")
            .eq("id", proposalId)
            .single();
          
          // Create a new project
          const { data: newProject, error: projectError } = await supabase
            .from("projects")
            .insert({
              titulo: serviceRequest.titulo,
              descricao: serviceRequest.descricao,
              categoria: serviceRequest.categoria,
              valor: proposal.valor,
              data_inicio: new Date().toISOString(),
              data_estimada: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days later
              endereco: serviceRequest.endereco,
              status: "em_andamento",
              concluido: false,
              avaliado: false,
              cliente_id: serviceRequest.cliente_id,
              profissional_id: proposal.profissional_id,
              nome_contraparte: proposal.nome_profissional,
              foto_contraparte: proposal.foto_profissional,
              especialidade_contraparte: proposal.especialidade_profissional,
              comentarios_iniciais: serviceRequest.informacoes_adicionais || ""
            })
            .select()
            .single();
          
          if (projectError) throw projectError;
          
          // Update service request status
          await supabase
            .from("service_requests")
            .update({ status: "contratado" })
            .eq("id", serviceRequestId);
          
          // Update all other proposals for this service request to rejected
          await supabase
            .from("proposals")
            .update({ status: "recusada" })
            .eq("service_request_id", serviceRequestId)
            .neq("id", proposalId);
          
          return new Response(
            JSON.stringify({ data: updatedProposal, project: newProject }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
          );
        }
        
        return new Response(
          JSON.stringify({ data: updatedProposal }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
      
      // Update project status
      if (path === "update-project") {
        const { projectId, status, concluido, comentariosFinais } = body;
        
        const updateData: any = {};
        
        if (status) updateData.status = status;
        if (concluido !== undefined) {
          updateData.concluido = concluido;
          if (concluido) {
            updateData.data_conclusao = new Date().toISOString();
          }
        }
        if (comentariosFinais) updateData.comentarios_finais = comentariosFinais;
        
        const { data: updatedProject, error } = await supabase
          .from("projects")
          .update(updateData)
          .eq("id", projectId)
          .select()
          .single();
        
        if (error) throw error;
        
        // If project is completed, increment the professional's services count
        if (concluido) {
          await supabase.rpc("increment_services_count", {
            prof_id: updatedProject.profissional_id
          });
        }
        
        return new Response(
          JSON.stringify({ data: updatedProject }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
      
      // Update project step
      if (path === "update-project-step") {
        const { stepId, concluido, comentario } = body;
        
        const updateData: any = {};
        if (concluido !== undefined) {
          updateData.concluido = concluido;
          if (concluido) {
            updateData.data_conclusao = new Date().toISOString();
          }
        }
        if (comentario) updateData.comentario = comentario;
        
        const { data: updatedStep, error } = await supabase
          .from("project_steps")
          .update(updateData)
          .eq("id", stepId)
          .select()
          .single();
        
        if (error) throw error;
        
        return new Response(
          JSON.stringify({ data: updatedStep }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }

    // Return 404 for undefined endpoints
    return new Response(
      JSON.stringify({ error: "Endpoint not found" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
    );

  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
