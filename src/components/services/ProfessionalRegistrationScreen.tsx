
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import CustomButton from '../common/CustomButton';
import { toast } from '@/components/ui/sonner';
import { Camera, Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const specialties = [
  { value: 'pedreiro', label: 'Pedreiro' },
  { value: 'pintor', label: 'Pintor' },
  { value: 'eletricista', label: 'Eletricista' },
  { value: 'encanador', label: 'Encanador' },
  { value: 'carpinteiro', label: 'Carpinteiro' },
  { value: 'marceneiro', label: 'Marceneiro' },
  { value: 'serralheiro', label: 'Serralheiro' },
  { value: 'gesseiro', label: 'Gesseiro' },
  { value: 'azulejista', label: 'Azulejista' },
  { value: 'jardineiro', label: 'Jardineiro' },
];

const additionalSpecialties = [
  { id: 'azulejista', label: 'Azulejista' },
  { id: 'piso_laminado', label: 'Piso Laminado' },
  { id: 'porcelanato', label: 'Porcelanato' },
  { id: 'drywall', label: 'Drywall/Gesso' },
  { id: 'impermeabilizacao', label: 'Impermeabilização' },
  { id: 'forro', label: 'Forro' },
  { id: 'vidracaria', label: 'Vidraçaria' },
  { id: 'marmoraria', label: 'Marmoraria' },
];

const formSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  especialidadePrincipal: z.string().min(1, 'Selecione sua especialidade principal'),
  especialidadesAdicionais: z.array(z.string()).optional(),
  telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 caracteres'),
  cidade: z.string().min(2, 'Informe sua cidade'),
  estado: z.string().length(2, 'Informe a sigla do estado (2 letras)'),
  sobre: z.string().min(20, 'A descrição deve ter pelo menos 20 caracteres').max(500, 'A descrição deve ter no máximo 500 caracteres'),
  areaAtuacao: z.string().min(5, 'Informe sua área de atuação')
});

type PortfolioImage = {
  id: number;
  file: File;
  preview: string;
};

const ProfessionalRegistrationScreen: React.FC = () => {
  const navigate = useNavigate();
  const [portfolioImages, setPortfolioImages] = useState<PortfolioImage[]>([]);
  const [profileImage, setProfileImage] = useState<{file: File; preview: string} | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      especialidadePrincipal: '',
      especialidadesAdicionais: [],
      telefone: '',
      cidade: '',
      estado: '',
      sobre: '',
      areaAtuacao: ''
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!profileImage) {
      toast.error('Por favor, adicione uma foto de perfil');
      return;
    }

    if (portfolioImages.length === 0) {
      toast.error('Por favor, adicione pelo menos uma imagem ao seu portfólio');
      return;
    }

    // Here would be the API call to register the professional
    console.log('Registrando profissional:', { 
      ...values, 
      profileImage, 
      portfolioImages 
    });
    
    toast.success('Cadastro realizado com sucesso!');
    navigate('/services');
  };

  const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setProfileImage({
        file,
        preview: URL.createObjectURL(file)
      });
    }
  };

  const handlePortfolioImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setPortfolioImages(prev => [
        ...prev,
        {
          id: Date.now(),
          file,
          preview: URL.createObjectURL(file)
        }
      ]);
    }
  };

  const removePortfolioImage = (id: number) => {
    setPortfolioImages(prev => prev.filter(img => img.id !== id));
  };

  return (
    <div className="flex flex-col pb-16">
      <div className="bg-white p-4 shadow-sm flex items-center justify-between">
        <h1 className="text-xl font-bold text-construPro-blue">Cadastro de Profissional</h1>
      </div>
      
      <div className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-col items-center mb-6">
              <div 
                className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden relative mb-2"
                style={profileImage ? { backgroundImage: `url(${profileImage.preview})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
              >
                {!profileImage && <Camera size={32} className="text-gray-400" />}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <p className="text-sm text-gray-500">Foto de perfil</p>
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="especialidadePrincipal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Especialidade principal</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione sua especialidade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {specialties.map((specialty) => (
                          <SelectItem key={specialty.value} value={specialty.value}>
                            {specialty.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="especialidadesAdicionais"
                render={() => (
                  <FormItem>
                    <FormLabel>Especialidades adicionais</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {additionalSpecialties.map((specialty) => (
                        <FormField
                          key={specialty.id}
                          control={form.control}
                          name="especialidadesAdicionais"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={specialty.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(specialty.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value || [], specialty.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== specialty.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {specialty.label}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone / WhatsApp</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="cidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input placeholder="Sua cidade" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <FormControl>
                          <Input placeholder="UF" maxLength={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="sobre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sobre você</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva sua experiência, há quanto tempo trabalha na área, etc." 
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="areaAtuacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área de atuação</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: São Paulo e região metropolitana" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Portfólio de trabalhos</FormLabel>
                <FormDescription className="text-sm mb-2">
                  Adicione fotos de trabalhos anteriores para mostrar sua experiência
                </FormDescription>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  {portfolioImages.map((img) => (
                    <div 
                      key={img.id} 
                      className="aspect-square rounded-md overflow-hidden relative"
                    >
                      <img 
                        src={img.preview} 
                        alt="Portfolio" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1"
                        onClick={() => removePortfolioImage(img.id)}
                      >
                        <X size={14} className="text-white" />
                      </button>
                    </div>
                  ))}
                  
                  <label className="aspect-square rounded-md border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                    <Upload size={24} className="text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500">Adicionar foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePortfolioImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <CustomButton 
              type="submit" 
              variant="primary"
              fullWidth
            >
              Finalizar cadastro
            </CustomButton>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ProfessionalRegistrationScreen;
